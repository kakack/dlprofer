/* !@file GpusView.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function GpusView() {
  document.title = 'DLProf: GPUs';

  this.chart_;
  this.gpuData_;
  this.ctx_ = '#gpusViewChart';
  this.mantissa_ = 2;
}

GpusView.prototype = {
  constructor: GpusView,

  initViewGpus: function (aggrID, domainName) {
    var gpuViewsOpen = {val: true};

    loadChevronEvents('#gpusViewChevron', '#gpuViewsPanel', gpuViewsOpen);

    this.getGpuData(aggrID, domainName);
  },

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (e, aggrID, domainName) {
    const self = this;
    self.getGpuData(aggrID, domainName);
  },

  getGpuData: function (aggrID, domainName) {
    const self = this;
    // Call the flask endpoint
    //
    $.ajax({
      type: 'GET',
      url: 'dlprof/rest/device_gpu_utilizations_data',
      async: true,
      data: {aggregation: aggrID, domain: domainName},
      success: function (jqXHR, textStatus, errorThrown) {
        self.gpuData_ = jqXHR;
        self.plotGpuData(self);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  plotGpuData: function (self) {
    this.fillTable(self);
    this.fillChart(self);
  },

  fillTable: function (self) {
    $('#gpusViewTable tbody').empty();

    for (var ii = 0; ii < self.gpuData_.length; ii++) {
      const gpuDevice = self.gpuData_[ii];
      const gpuUtilization = numberToDecimal(
        gpuDevice.device_gpu_utilization,
        self.mantissa_
      );
      const computeCapability =
        '' + gpuDevice.cuda_major + '.' + gpuDevice.cuda_minor;
      var htmlRow = '';
      htmlRow += '<tr>';
      htmlRow += "<td align='center'>" + gpuDevice.device_id + '</td>';
      htmlRow +=
        "<td align='center' class='cudaNoWrap'>" + gpuDevice.gpu_name + '</td>';
      htmlRow += "<td align='center'>" + gpuUtilization + ' %</td>';
      htmlRow += "<td align='center'>" + computeCapability + '</td>';
      htmlRow += "<td align='center'>" + gpuDevice.sm_count + '</td>';
      htmlRow += '</tr>';

      $('#gpusViewTable').find('tbody').append(htmlRow);
    }
  },

  fillChart: function (self) {
    var labels = [];
    var deviceGpuUtilization = [];

    for (var ii = 0; ii < self.gpuData_.length; ii++) {
      const gpuDevice = self.gpuData_[ii];

      const gpuUtilization = numberToDecimal(
        gpuDevice.device_gpu_utilization,
        self.mantissa_
      );

      deviceGpuUtilization.push(gpuUtilization);

      labels.push(gpuDevice.device_id);
    }

    var barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'GPU Utilization',
          backgroundColor: '#0079DB',
          data: deviceGpuUtilization,
        },
      ],
      options: {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    };

    if (self.chart_ != null) {
      self.chart_.destroy();
    }

    self.chart_ = new Chart($(self.ctx_), {
      type: 'bar',
      data: barChartData,
      options: {
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          display: false,
        },
        animation: false,
        responsive: true,
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: 'GPU Device ID',
              },
              stacked: true,
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: 'Utilization (%)',
              },
              stacked: true,
              display: true,
              ticks: {
                beginAtZero: true,
                min: 0,
                max: 100.0,
              },
            },
          ],
        },
      },
    });
  },
};
