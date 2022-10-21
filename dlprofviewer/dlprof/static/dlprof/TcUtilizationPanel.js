/* !@file TcUtilizationPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function TcUtilizationPanel() {
  this.tcUtilizationPieChart_ = new DLprofPieChart(
    ['Using Tensor Cores', 'Not Using Tensor Cores'],
    [Globals.GREAT, Globals.BAD],
    '#tcUtilizationPieChart',
    'tcUtilizationPieChartLegend'
  );

  this.tcUtilization_ = 0;
  this.nonTcUtilization_ = 0;
}

TcUtilizationPanel.prototype = {
  constructor: TcUtilizationPanel,

  fill: function (aggrID, domainName) {
    this.loadTcUtilization(aggrID, domainName);
  },

  loadTcUtilization: function (aggrID, domainName) {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/tc_utilization_percentage_panel',
      data: {aggregation: aggrID, domain: domainName},
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.fillModel(jqXHR['tc_utilization']);
        self.fillPieChart();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  fillModel: function (tcUtilization) {
    this.tcUtilization_ = numberToDecimal(tcUtilization, 1);
    this.nonTcUtilization_ = numberToDecimal(100.0 - this.tcUtilization_, 1);
  },

  fillPieChart: function () {
    this.tcUtilizationPieChart_.draw([
      this.tcUtilization_,
      this.nonTcUtilization_,
    ]);
  },
};
