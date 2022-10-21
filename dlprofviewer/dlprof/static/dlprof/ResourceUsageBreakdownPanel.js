/* !@file ResourceUsageBreakdownPanel.js
 *
 * Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function ResourceUsageBreakdownPanel() {
  this.resourceUsageBreakdown_ = new DLprofPieChart(
    [
      'Using Tensor Cores',
      'Not Using Tensor Cores',
      'Memory',
      'Dataloader',
      'I/O',
      'CPU',
      'Other',
    ],
    [
      Globals.GREAT,
      Globals.GOOD,
      Globals.OK,
      Globals.WARNING1,
      Globals.WARNING2,
      Globals.WARNING3,
      Globals.BAD,
    ],
    '#resourceUsageBreakdownPieChart',
    'resourceUsageBreakdownPieChartLegend'
  );

  this.tcDurationPct_ = 0;
  this.nonTcDurationPct_ = 0;
  this.memoryDurationPct_ = 0;
  this.dataloaderDurationPct_ = 0;
  this.ioDurationPct_ = 0;
  this.cpuDurationPct_ = 0;
  this.otherDurationPct_ = 0;
}

ResourceUsageBreakdownPanel.prototype = {
  constructor: ResourceUsageBreakdownPanel,

  fill: function (aggrID, domainName) {
    this.loadResourceUsageBreakdown(aggrID, domainName);
  },

  loadResourceUsageBreakdown: function (aggrID, domainName) {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/resource_usage_breakdown_panel',
      data: {aggregation: aggrID, domain: domainName},
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.fillModel(jqXHR);
        self.fillPieChart();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  fillModel: function (db) {
    this.tcDurationPct_ = db['tc_duration_pct'];
    this.nonTcDurationPct_ = db['non_tc_duration_pct'];
    this.memoryDurationPct_ = db['memory_duration_pct'];
    this.dataloaderDurationPct_ = db['dataloader_duration_pct'];
    this.ioDurationPct_ = db['io_duration_pct'];
    this.cpuDurationPct_ = db['cpu_duration_pct'];
    this.otherDurationPct_ = db['other_duration_pct'];
  },

  fillPieChart: function () {
    this.resourceUsageBreakdown_.draw([
      numberToDecimal(this.tcDurationPct_, 2),
      numberToDecimal(this.nonTcDurationPct_, 2),
      numberToDecimal(this.memoryDurationPct_, 2),
      numberToDecimal(this.dataloaderDurationPct_, 2),
      numberToDecimal(this.ioDurationPct_, 2),
      numberToDecimal(this.cpuDurationPct_, 2),
      numberToDecimal(this.otherDurationPct_, 2),
    ]);
  },
};
