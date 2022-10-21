/* !@file TopTenOpsPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function TopTenOpsPanel() {
  this.GPU_TIME = 0;
  this.OP_NAME = 1;
  this.DIRECTION = 2;
  this.OP_TYPE = 3;
  this.CALLS = 4;
  this.TC_ELIGIBLE = 5;
  this.USING_TC = 6;

  this.topTenDataTable_ = null;
  this.aggrID_ = null;
  this.domainName_ = null;
}

TopTenOpsPanel.prototype = {
  constructor: TopTenOpsPanel,

  fill: function(aggrID, domainName) {
    const self = this;
    self.aggrID_ = aggrID;
    self.domainName_ = domainName;

    if (this.topTenDataTable_ == null) {
      this.topTenDataTable_ = $('#datatableSummaryTopTenOps').DataTable({
        bProcessing: true,
        bServerSide: true,
        bjQueryUI: true,
        sAjaxSource: 'dlprof/datatable/top10gpu_datatable',
        sAjaxDataProp: 'topTenDataProp',
        autoWidth: false,
        info: false,
        paging: false,
        destroy: true,
        ordering: false,
        info: false,
        bFilter: false,
        autoWidth: false,
        columns: [
          {data: 'gpu_time'},
          {data: 'op_node_name'},
          {data: 'direction'},
          {data: 'op_node_type'},
          {data: 'num_calls'},
          {data: 'tc_eligible'},
          {data: 'using_tc'},
        ],
        fnServerParams: function(aoData) {
          aoData.push({name: 'aggregation', value: self.aggrID_});
          aoData.push({name: 'domain', value: self.domainName_});
        },
        aoColumnDefs: [
          {
            aTargets: [this.GPU_TIME],
            sClass: 'dt-body-right dt-head-center',
            render: function(data, type, row, meta) {
              return (
                  '<span class="cudaNoWrap">' + getRenderableNumber(data) +
                  '</span>');
            },
          },
          {
            aTargets: [this.CALLS, this.TC_ELIGIBLE, this.USING_TC],
            sClass: 'dt-center',
          },
          {
            aTargets: [this.TC_ELIGIBLE, this.USING_TC],
            render: function(data, type, row, meta) {
              return data == 1 ? Globals.faCheck : Globals.faTimes;
            },
          },
          {
            aTargets: [this.DIRECTION],
            visible: Globals.isPytorchFramework(),
          },
        ],
      });
    } else {
      this.topTenDataTable_.draw();
    }
  },
};
