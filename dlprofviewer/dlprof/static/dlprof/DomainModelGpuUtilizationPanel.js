/* !@file DomainModelGpuUtilizationPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function DomainModelGpuUtilizationPanel() {
  this.gpuUtilizationPieChart_ = new DLprofPieChart(
    ['Using GPU', 'Idle GPU'],
    [Globals.GREAT, Globals.BAD],
    '#gpuUtilizationPieChart',
    'gpuUtilizationPieChartLegend'
  );

  this.idle_ = 0.0;
  this.utilized_ = 0.0;
}

DomainModelGpuUtilizationPanel.prototype = {
  constructor: DomainModelGpuUtilizationPanel,

  fill: function (aggrID, domainName) {
    this.loadGpuUtilization(aggrID, domainName);

    Globals.getGpuCount() > 1
      ? $('#showGpusMenu').show()
      : $('#showGpusMenu').hide();
  },

  loadGpuUtilization: function (aggrID, domainName) {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/domain_model_gpu_utilization_percentage_panel',
      data: {aggregation: aggrID, domain: domainName},
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        const gpuUtilization = jqXHR['gpu_utilization'];
        self.fillModel(gpuUtilization);
        self.fillPieChart();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  fillModel: function (gpuUtilization) {
    this.utilized_ = numberToDecimal(gpuUtilization);
    this.idle_ = numberToDecimal(100.0 - this.utilized_, 1);
  },

  fillPieChart: function () {
    this.gpuUtilizationPieChart_.draw([this.utilized_, this.idle_]);
  },
};
