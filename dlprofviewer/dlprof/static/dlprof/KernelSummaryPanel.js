/* !@file KernelSummaryPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function KernelSummaryPanel() {
  this.kernelUtilizationPieChart_ = new DLprofPieChart(
    ['Using Tensor Cores', 'Memory Kernels', 'All Other Kernels'],
    [Globals.GREAT, Globals.OK, Globals.BAD],
    '#kernelUtilizationPieChart',
    'kernelUtilizationPieChartLegend'
  );

  this.allKernelsGpuTime_ = 0;
  this.allKernelsCount_ = 0;

  this.tcKernelsGpuTime_ = 0;
  this.tcKernelsCount_ = 0;

  this.memKernelsGpuTime_ = 0;
  this.memKernelsCount_ = 0;

  this.otherKernelsGpuTime_ = 0;
  this.otherKernelsCount_ = 0;

  if (Globals.getGpuCount() > 1) {
    var title =
      'Total GPU time summed across ' + Globals.getGpuCount() + ' GPUs';
    $('#KernelSummaryPanelInfo').attr('title', title);
  }
}

KernelSummaryPanel.prototype = {
  constructor: KernelSummaryPanel,

  fill: function (aggrID, domainName) {
    this.loadKernelSummary(aggrID, domainName);
  },

  loadKernelSummary: function (aggrID, domainName) {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/kernel_summary_panel',
      data: {aggregation: aggrID, domain: domainName},
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.fillModel(jqXHR);
        self.fillTable();
        self.fillPieChart();
        self.setupKernelSummaryPanelClickListener(
          '#showKernelDetails',
          self.getKernelProperties,
          jqXHR
        );
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  fillModel: function (db) {
    this.allKernelsGpuTime_ = db['total_gpu_time'] / 1000 / 1000;
    this.allKernelsCount_ = db['total_count'];

    this.tcKernelsGpuTime_ = db['using_tc_gpu_time'] / 1000 / 1000;
    this.tcKernelsCount_ = db['using_tc_count'];

    this.memKernelsGpuTime_ = db['memory_gpu_time'] / 1000 / 1000;
    this.memKernelsCount_ = db['memory_count'];

    this.otherKernelsGpuTime_ = db['other_gpu_time'] / 1000 / 1000;
    this.otherKernelsCount_ = db['other_count'];
  },

  fillTable: function () {
    renderDuration('#allKernelsGpuTime', this.allKernelsGpuTime_);
    renderNumber('#allKernelsTotalCount', this.allKernelsCount_);

    renderDuration('#tcKernelsGpuTime', this.tcKernelsGpuTime_);
    renderNumber('#tcKernelsTotalCount', this.tcKernelsCount_);

    renderDuration('#memoryKernelsGpuTime', this.memKernelsGpuTime_);
    renderNumber('#memoryKernelsTotalCount', this.memKernelsCount_);

    renderDuration('#otherKernelsGpuTime', this.otherKernelsGpuTime_);
    renderNumber('#otherKernelsTotalCount', this.otherKernelsCount_);
  },

  fillPieChart: function () {
    this.kernelUtilizationPieChart_.draw([
      Math.floor(this.tcKernelsGpuTime_),
      Math.floor(this.memKernelsGpuTime_),
      Math.floor(this.otherKernelsGpuTime_),
    ]);
  },

  setupKernelSummaryPanelClickListener: function (
    selector,
    callbackFunction,
    kernelSummary
  ) {
    $(selector)
      .unbind()
      .click(function (e) {
        e.preventDefault();

        $('#dlprof-wrapper').removeClass('right-toggled');

        callbackFunction(kernelSummary);
      });
  },

  getKernelProperties: function (kernelSummary) {
    $('#kernelDetailsPanel').show();

    KernelSummaryPanel.prototype.fillModel(kernelSummary);
    KernelSummaryPanel.prototype.fillTable();

    if (Globals.getGpuCount() > 1) {
      var title =
        'Total GPU time summed across ' + Globals.getGpuCount() + ' GPUs';
      $('.gpu-time-col').attr('title', title);
    }

    $('#closeKernelDetailsPanel')
      .unbind()
      .click(function (e) {
        e.preventDefault();
        $('#dlprof-wrapper').addClass('right-toggled');
      });
  },
};
