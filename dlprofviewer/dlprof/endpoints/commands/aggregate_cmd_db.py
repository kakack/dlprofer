# !@file aggregate_cmd_db.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from dlprof.endpoints.sql import Sql
import json
import ctypes
import os
import sys
import tempfile

class AggregateCmdDB(Sql):
    _new_iter_start = None
    _new_iter_stop = None
    _new_key_op_name = None

    class Data(ctypes.Structure):
        _fields_ = [("key_op", ctypes.c_char_p),
                    ("iter_start", ctypes.c_uint),
                    ("iter_stop", ctypes.c_uint)]

    def __init__(self, request):
        self._new_iter_start = request['newIterStart']
        self._new_iter_stop = request['newIterStop']
        self._new_key_op_name = request['newKeyOpName']

    def do_command(self):

        print('Starting to reaggregate')

        err_msg = 'OK'      # everything is ok - nothing to report
        ret_code = 200      # "OK" (Standard response for successful HTTP request)
        err_code = 0

        try:
            # Load SO file into ctypes
            #
            core_library = ctypes.CDLL(self._shared_library_file)

            # Convert user's reaggregation parameters into CTYPES
            #
            new_key_op = self._new_key_op_name.encode('utf-8')
            new_iter_start = ctypes.c_uint32(int(self._new_iter_start)).value
            new_iter_stop = ctypes.c_uint32(int(self._new_iter_stop)).value
            data = self.Data(new_key_op, new_iter_start, new_iter_stop)

            # Get name of dbprof core database
            #
            db_file_path = Sql.get_dlprof_coredb_filename()
            print('Name of DLPROF core database: db_file_path=<' + db_file_path + '>')

            # Reaggregate
            #
            core_library.DLPROF_aggregate_by_file.argtypes = [ctypes.c_char_p, ctypes.POINTER(self.Data)]
            core_db_for_ctypes = ctypes.c_char_p(db_file_path.encode('utf-8'))   # convert string to bytes via this encode call to UTF-8

            # Capture stderr
            #
            with tempfile.TemporaryFile() as tmp_file:
                original_stderr = os.dup(sys.__stderr__.fileno())
                os.dup2(tmp_file.fileno(), sys.__stderr__.fileno())

                err_code = core_library.DLPROF_aggregate_by_file(core_db_for_ctypes, ctypes.byref(data))

                # Restore stderr
                #
                os.dup2(original_stderr, sys.__stderr__.fileno())

                if (err_code != 0):
                    # Set code and message
                    #
                    ret_code = 500      # Internal Server Error (A generic error message given when an unexpected condition was encountered)
                    tmp_file.seek(0)
                    err_msg = tmp_file.read().decode('utf-8')

                else:
                    print('Aggregate success!')

        except OSError as error:
            ret_code = 500      # Internal Server Error (A generic error message given when an unexpected condition was encountered)
            err_msg = str(error)


        return json.dumps({'status':err_msg}), ret_code
