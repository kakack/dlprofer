/* !@file OpTypeSummaryPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function OpTypeSummaryPanel() {
  document.title = 'DLProf: Op Type Summary';

  this.opTypeSummaryDataTable_ = null;
  this.aggrID_ = null;
  this.domainName_ = null;

  this.COL_OP_TYPE = 0;
  this.COL_NUM_OPS = 1;
  this.COL_NUM_CALLS = 2;

  this.COL_CPU_TOTAL = 3;
  this.COL_CPU_AVG = 4;
  this.COL_CPU_MIN = 5;
  this.COL_CPU_MAX = 6;

  this.COL_GPU_TOTAL = 7;
  this.COL_GPU_AVG = 8;
  this.COL_GPU_MIN = 9;
  this.COL_GPU_MAX = 10;

  this.COL_CPU_OVERHEAD_TOTAL = 11;
  this.COL_CPU_OVERHEAD_AVG = 12;
  this.COL_CPU_OVERHEAD_MIN = 13;
  this.COL_CPU_OVERHEAD_MAX = 14;

  this.COL_GPU_IDLE_TOTAL = 15;
  this.COL_GPU_IDLE_AVG = 16;
  this.COL_GPU_IDLE_MIN = 17;
  this.COL_GPU_IDLE_MAX = 18;
}

OpTypeSummaryPanel.prototype = {
  constructor: OpTypeSummaryPanel,

  fill: function (aggrID, domainName) {
    this.initOpTypeSummaryTable(aggrID, domainName);
  },

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (e, aggrID, domainName) {
    const self = this;
    self.fill(aggrID, domainName);
  },

  initOpTypeSummaryTable: function (aggrID, domainName) {
    const self = this;
    self.aggrID_ = aggrID;
    self.domainName_ = domainName;

    if (self.opTypeSummaryDataTable_ == null) {
      self.opTypeSummaryDataTable_ = $('#datatableOpTypeSummary').DataTable({
        destroy: true,
        dom: getDatatablesDom(),
        buttons: getDatatableButtons(
          Globals.getProfileName() + ' Op Type Summary',
          'landscape',
          true
        ),
        select: true,
        bProcessing: true,
        bServerSide: true,
        bjQueryUI: true,
        sAjaxSource: 'dlprof/datatable/op_type_summary_datatable',
        sAjaxDataProp: 'opTypeSummaryProp',
        autoWidth: false,
        order: [this.COL_GPU_TOTAL, 'desc'], // pre-sort
        columns: [
          {data: 'op_node_type'},
          {data: 'num_nodes'},
          {data: 'num_calls'},
          {data: 'cpu_time_sum'},
          {data: 'cpu_time_avg'},
          {data: 'cpu_time_min'},
          {data: 'cpu_time_max'},
          {data: 'gpu_time_sum'},
          {data: 'gpu_time_avg'},
          {data: 'gpu_time_min'},
          {data: 'gpu_time_max'},
          {data: 'cpu_overhead_sum'},
          {data: 'cpu_overhead_avg'},
          {data: 'cpu_overhead_min'},
          {data: 'cpu_overhead_max'},
          {data: 'gpu_idle_sum'},
          {data: 'gpu_idle_avg'},
          {data: 'gpu_idle_min'},
          {data: 'gpu_idle_max'},
        ],
        fnServerParams: function (aoData) {
          aoData.push({name: 'aggregation', value: self.aggrID_});
          aoData.push({name: 'domain', value: self.domainName_});
        },
        aoColumnDefs: [
          {
            aTargets: [
              this.COL_NUM_OPS,
              this.COL_NUM_CALLS,
              this.COL_CPU_TOTAL,
              this.COL_CPU_AVG,
              this.COL_CPU_MIN,
              this.COL_CPU_MAX,
              this.COL_GPU_TOTAL,
              this.COL_GPU_AVG,
              this.COL_GPU_MIN,
              this.COL_GPU_MAX,
              this.COL_CPU_OVERHEAD_TOTAL,
              this.COL_CPU_OVERHEAD_AVG,
              this.COL_CPU_OVERHEAD_MIN,
              this.COL_CPU_OVERHEAD_MAX,
              this.COL_GPU_IDLE_TOTAL,
              this.COL_GPU_IDLE_AVG,
              this.COL_GPU_IDLE_MIN,
              this.COL_GPU_IDLE_MAX,
            ],
            sClass: 'dt-body-right dt-head-center',
            render: function (data, type, row, meta) {
              return (
                '<span class="cudaNoWrap">' +
                getRenderableNumber(data) +
                '</span>'
              );
            },
          },
          {
            aTargets: ['sortDescFirst'],
            asSorting: ['desc', 'asc'],
          },
        ],
      });

      prependExportLabel();
    } else {
      self.opTypeSummaryDataTable_.draw();
    }
  },
};
