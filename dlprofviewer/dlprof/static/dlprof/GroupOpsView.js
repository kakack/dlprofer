/* !@file GroupOpsView.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION & AFFILIATES.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

/**
 * 3rd Party Treetable Control docs
 *    https://www.npmjs.com/package/treetables
 *    https://github.com/reside-ic/TreeTables
 */

function GroupOpsView() {
  document.title = 'DLProf: Group Ops';

  this.COL_ROW_TYPE = 1;
  this.COL_TRIMMED = 2;

  this.ROW_TYPE_GROUP = 1; // See GroupOpsWriter.ROW_TYPE
  this.ROW_TYPE_OP = 2; // See GroupOpsWriter.ROW_TYPE

  this.INDENTATION_FACTOR = 5;

  $('#groupOrOpHdr').html('Group or Op');
}

GroupOpsView.prototype = {
  constructor: GroupOpsView,

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (_e, _aggrID, _domainName) {
    const self = this;

    // TreeTable plugin does not appear to support reload
    // Thus, just reload browser page.  AggrID and domain will come from cookies
    //
    location.reload();
  },

  fill: function (aggrID, domainName) {
    const self = this;

    $.ajax({
      type: 'GET',

      url: 'dlprof/rest/group_ops_treetable',
      async: true,
      data: {aggregation: aggrID, domain: domainName},
      success: function (jqXHR, _textStatus, _errorThrown) {
        self.loadTreeTable(jqXHR);
        self.addRowSelectionListener();
        self.addButtonListeners();
        self.makeFirstColumnWider();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  loadTreeTable: function (jqXHR) {
    const self = this;

    $('#group-ops-treetable').treeTable({
      data: jqXHR,
      collapsed: false,
      columns: [
        {
          data: 'row_type',
          sClass: 'dt-body-center dt-head-center',
          visible: true,
          render: function (data, _type, row) {
            row_type_db = row['row_type'];
            const type = row_type_db == self.ROW_TYPE_GROUP ? 'Group' : 'Op';
            return '<span title="' + type + '">' + type + '</span>';
          },
        },
        {
          data: 'row_full_id',
          visible: false,
        },
        {
          data: 'row_full_name',
          visible: false,
        },
        {
          data: 'row_trimmed_name',
          sClass: 'dt-body-left dt-head-left',
          visible: true,
          render: function (data, _type, row) {
            level = row['level'];
            row_type = row['row_type'];
            row_full_id = row['row_full_id'];
            row_full_name = row['row_full_name'];

            space_count = level - 1;
            space_str = '';
            type = row_type == self.ROW_TYPE_GROUP ? 'Group' : 'Op';

            for (var ii = 0; ii < space_count * self.INDENTATION_FACTOR; ii++) {
              space_str += '&nbsp;';
            }

            // See HTML5 custom data attributes on how this code
            // adds ID and NAME fields inside a SPAN
            // https://www.sitepoint.com/how-why-use-html5-custom-data-attributes/
            //
            return (
              '<span id="groupOpsNodes" title="' +
              type +
              '" data-row_full_id="' +
              row_full_id +
              '" data-row_full_name="' +
              row_full_name +
              '"  >' +
              space_str +
              data +
              '</span>'
            );
          },
        },
        {data: 'level', sClass: 'dt-body-center dt-head-center'},
        {
          data: 'num_op_instances',
          sClass: 'dt-body-right dt-head-center',
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
          render: function (data) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
        {
          data: 'num_supported_leaf_ops',
          sClass: 'dt-body-right dt-head-center',
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
          render: function (data) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
        {
          data: 'num_tc_leaf_ops',
          sClass: 'dt-body-right dt-head-center',
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
          render: function (data) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
        {
          data: 'cpu_time_sum',
          sClass: 'dt-body-right dt-head-center',
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
          render: function (data) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
        {
          data: 'gpu_time_sum',
          sClass: 'dt-body-right dt-head-center',
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
          render: function (data) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
        {
          data: 'cpu_overhead_sum',
          sClass: 'dt-body-right dt-head-center',
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
          render: function (data) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
        {
          data: 'gpu_idle_sum',
          sClass: 'dt-body-right dt-head-center',
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
          render: function (data) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
      ],
      order: [[2, 'asc']],
    });
  },

  addRowSelectionListener: function () {
    const self = this;

    $('#group-ops-treetable tbody').on('click', 'tr', function () {
      $tr = $('#group-ops-treetable tr');
      $tr.removeClass('row_selected');
      $(this).addClass('row_selected');
      const children = $(this).children();
      const row_type_raw = children[self.COL_ROW_TYPE].innerHTML;
      const isGroup = row_type_raw.includes('Group');
      const row_type_str = isGroup ? 'Group' : 'Op';
      $('.groupOpsRowType').text(row_type_str);

      // See HTML5 custom data attributes on how this code
      // adds ID and NAME fields inside a SPAN
      // https://www.sitepoint.com/how-why-use-html5-custom-data-attributes/
      //
      const $data_labels = $(children[self.COL_TRIMMED].innerHTML);

      const row_full_name = $data_labels.data('row_full_name');
      $('#selectedGroupOpNameSpan').text(row_full_name);
      $('#selectedGroupOpSpan').text(row_full_name);

      const row_full_id = $data_labels.data('row_full_id');
      $('#selectedGroupOpIDSpan').text(row_full_id);

      // Either show a table (with ID and NAME), or
      // Just show a label with the NAME inside.
      // (The table is used to align the first charactor of the ID and NAME)
      //
      if (row_full_id === row_full_name) {
        $('#selectedGroupOpTable').hide();
        $('#selectedGroupOpLabel').show();
      } else {
        $('#selectedGroupOpTable').show();
        $('#selectedGroupOpLabel').hide();
      }
    });
  },

  addButtonListeners: function () {
    $('#expand').on('click', function () {
      $('#group-ops-treetable').data('treeTable').expandAllRows().redraw();
    });

    $('#collapse').on('click', function () {
      $('#group-ops-treetable').data('treeTable').collapseAllRows().redraw();
    });
  },

  makeFirstColumnWider: function () {
    // Widen the plugin's first column to account for many levels
    //
    $th = $('#group-ops-treetable thead tr:first th:first');
    $th.css('min-width', '50px');
  },
};
