# !@file datatables_db.py
#
#  Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
#
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from abc import ABC, abstractmethod
from dlprof.endpoints.sql import Sql

# Abstract base class for all DataTable classes
# Contains common code for all datatables
# Contains abstract methods for customization
# For example:
#   All datatables provide the same ability to sort and filter (this class)
#   But all datatables have different columns (super classes)
#
class DatatablesDB(ABC, Sql):
    _request = None
    _datatable_constraint = ''      # contains ORDER BY, LIMIT, and OFFSET
    _global_filter = ''             # contains text from SEARCH box in datatable UI
    _column_filter = ''             # contains text from each column's SEARCH box

    def __init__(self, request):
        self._request = request
        self._datatable_constraint, self._datatable_constraint_args = self.__get_datatable_constraint(self._request)
        self._global_filter, self._global_filter_args = self.__get_global_filter(self._request)
        self._column_filter, self._column_filter_args = self.__get_column_filter(self._request)

    # Used to return all the data to be displayed inside a DataTable UI
    #
    def get_result(self):
        # Step 1 - Get the total count in the result set (iTotalRecords)
        #
        iTotalRecords = self.__get_total_records()

        # Step 2 - Get the count of the filtered result set (iTotalDisplayRecords)
        #
        iTotalDisplayRecords = self.__get_total_display_records()

        # Step 3 - Get the filtered result set
        #
        payload = self.__get_result_set()

        # Package up the response in a map
        #
        response = {}
        response['iTotalRecords'] = iTotalRecords
        response['iTotalDisplayRecords'] = iTotalDisplayRecords
        response[self.get_property_key()] = payload

        return response

    # Converts list of columns to a CSV list (sans trailing comma)
    # ['a', 'b', 'c'] gets converted to a, b, c  (<=== note no comma after trailing column)
    #
    def get_column_list(self):
        
        ret = ''
        for column in self.get_columns():
            if (len(ret) > 0):
                ret += ', '
            ret += column
        return ret

    # Forces super class to configure custom columns in datatable
    #
    @abstractmethod
    def get_columns(self):
        pass

    # Forces super class to configure custom datatable key
    #
    @abstractmethod
    def get_property_key(self):
        pass

    # Forces super class to generate custom SQL for filtering
    #
    @abstractmethod
    def get_search_constraint(self):
        pass

    # All super classes implement this function the same way
    def get_sql_count(self):
        return self._sql_count, self._sql_args

    # All super classes implement this function the same way
    def get_sql_rows(self):
        return self._sql_rows, self._sql_args

    # This is the 5507 in 'Showing 1 to 2 of 2 entries (filtered from 5,507 total entries)'
    #
    def __get_total_records(self):
        _sql, _args = self.get_sql_count()
        db_row = self.do_query(self._request, _sql, _args)
        return db_row[0][0]

    # This is the '2 entries' in 'Showing 1 to 2 of 2 entries (filtered from 5,507 total entries)'
    #
    def __get_total_display_records(self):
        _sql, _args = self.get_sql_count()
        sql  = _sql  + self._global_filter      + self._column_filter
        args = _args + self._global_filter_args + self._column_filter_args
        db_row = self.do_query(self._request, sql, args)

        return db_row[0][0]

    # These are the two rows in the datatable in 'Showing 1 to 2 of 2 entries (filtered from 5,507 total entries)'
    #
    def __get_result_set(self):

        _sql, _args = self.get_sql_rows()
        sql  = _sql  + self._global_filter      + self._column_filter      + self._datatable_constraint
        args = _args + self._global_filter_args + self._column_filter_args + self._datatable_constraint_args
        db_rows = self.do_query(self._request, sql, args)

        payload = []
        columns = self.get_columns()
        for db_row in db_rows:
            row = {}

            for idx in range(len(columns)):
                row[columns[idx]] = db_row[idx]

            payload.append(row)

        return payload

    # Converts the HTTP REQUEST properties into SQL operators
    #   iDisplayStart -> OFFSET
    #   iDisplayLength -> LIMIT
    #   iSortCol_0 -> ORDER BY
    #   sSortDir_0 -> 'asc or 'desc'
    #
    def __get_datatable_constraint(self, values):
        amount = 10
        start = 0
        columnIndex = 0
        sortDirection = 'asc'

        iDisplayStart = values['iDisplayStart']
        iDisplayLength = values['iDisplayLength']
        iSortCol_0 = values['iSortCol_0']
        sSortDir_0 = values['sSortDir_0']

        if iDisplayStart != None:
            start = int(iDisplayStart)

            if (start < 0):
                start = 0

        if iDisplayLength != None and len(iDisplayLength) > 0:
            amount = int(iDisplayLength)

            if amount < 10:
                amount = 10

        if iSortCol_0 != None:
            columnIndex = int(iSortCol_0)

        colName = self.get_columns()[columnIndex]

        if sSortDir_0 != None:
            if sSortDir_0 != 'asc':
                sortDirection = 'desc'

        datatable_constraint = ''
        datatable_constraint_args = []

        if colName != None:
            colName = 'cast(block as integer)' if colName == 'block' else colName
            colName = 'cast(grid as integer)' if colName == 'grid' else colName
            datatable_constraint += ' ORDER BY ' + colName + ' ' + sortDirection + ' '

        datatable_constraint += ' LIMIT ? OFFSET ? '
        datatable_constraint_args += [ str(amount), str(start) ]

        return datatable_constraint, datatable_constraint_args

    # Calls super class to build custom SQL search constraint (ie, LIKE operator)
    #
    def __get_global_filter(self, values):

        searchSQL = ''
        searchArgs = []

        searchTerm = values['sSearch']

        if searchTerm != None and len(searchTerm) > 0:
            searchSQL = self.get_search_constraint()
            searchArgs += searchSQL.count("?") * [ "%"+searchTerm+"%" ]

        return searchSQL, searchArgs

    # Appends to WHERE clause to filter on individual columns
    #
    def __get_column_filter(self, values):

        searchSQL = ''
        searchArgs = []

        columns = self.get_columns()
        for idx in range(len(columns)):
            bSearchableKey = 'bSearchable_' + str(idx)
            if (values[bSearchableKey]):
                sSearchKey = 'sSearch_' + str(idx)
                sSearch = values[sSearchKey]
                if (len(sSearch) > 0):
                    mDataPropKey = 'mDataProp_' + str(idx)
                    if values[mDataPropKey] in columns:
                        searchSQL += " AND %s LIKE ? " % values[mDataPropKey]
                        searchArgs += [ "%"+sSearch+"%" ]
                    else:
                        raise AttributeError("Query requested unknown field ["+values[mDataPropKey]+"]")

        return searchSQL, searchArgs
