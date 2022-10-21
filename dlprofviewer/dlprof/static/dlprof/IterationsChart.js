/* !@file IterationsChart.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function IterationsChart() {
  this.ctx_ = null;
  this.chart_ = null;
  this.staticIterations_ = [];
  this.profiledIterations_ = [];
  this.showAllIterations_ = true;
  this.longestIteration_ = 0;
  this.headRoom_ = 1.2; // Headroom between top of tallest bar and top of chart
  this.show_tooltip_ = true;

  this.DATASET_USING_TC = 0;
  this.DATASET_NOT_USING_TC = 1;
  this.DATASET_MEMORY = 2;
  this.DATASET_DATALOADER = 3;
  this.DATASET_IO = 4;
  this.DATASET_CPU = 5;
  this.DATASET_OTHER = 6;
  this.DATASET_OUTSIDE_PROFILE = 7;
  this.DATASET_PROFILE_BOUNDARY = 8;

  this.TOTAL_DATASETS = 9;
}

IterationsChart.prototype = {
  constructor: IterationsChart,

  initChart: function (selector, aggrID, domainName, callback) {
    const self = this;
    self.ctx_ = $(selector);
    self.showAllIterations_ = true;

    $('#iterationDashboardDiv').hide();
    $('#iterationsViewDurationsPanel').hide();
    $('.pleaseWait').show();

    $.when(
      self.getAllIterations(aggrID),
      self.getProfiledIterations(aggrID, domainName),
      getLongestDuration(aggrID, domainName)
    ).done(function (a1, a2, a3) {
      const values = a3[0];
      const duration = values['duration'];
      self.longestIteration_ = duration;
      $('.pleaseWait').hide();
      $('#iterationDashboardDiv').show();
      $('#iterationsViewDurationsPanel').show();
      self.fillChart();

      if (callback != null) {
        callback();
      }
    });
  },

  getAllIterations: function (aggrID) {
    const self = this;
    // Call the flask endpoint
    //
    return $.ajax({
      type: 'GET',
      url: 'dlprof/rest/iterations_all_data',
      data: {aggregation: aggrID},
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.staticIterations_ = jqXHR;
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  getProfiledIterations: function (aggrID, domainName) {
    const self = this;
    // Call the flask endpoint
    //
    return $.ajax({
      type: 'GET',
      url: 'dlprof/rest/iterations_profiled_data',
      data: {aggregation: aggrID, domain: domainName},
      async: true,
      success: function (jqXHR, textStatus, errorThrown) {
        self.profiledIterations_ = jqXHR;
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },

  getProfiledIteration: function (iterValue) {
    var returnValue;

    if (this.profiledIterations_ != null) {
      for (var ii = 0; ii < this.profiledIterations_.length; ii++) {
        const profiledIteration = this.profiledIterations_[ii];
        if (profiledIteration['iter_value'] == iterValue) {
          returnValue = profiledIteration;
          break;
        }
      }
    }
    return returnValue;
  },

  showStartStop: function (newStart = 0, newStop = 0) {
    newStart = Number(newStart);
    newStop = Number(newStop);

    if (newStart > newStop) {
      return;
    }

    const datasets = this.chart_.data.datasets;
    const lineSeries = this.getStartEndLineSeries(newStart, newStop);

    if (datasets.length == this.TOTAL_DATASETS) {
      // Get existing data set
      //
      const boundaryDataSet = datasets[this.DATASET_PROFILE_BOUNDARY];

      // Overwite it with new line series
      //
      boundaryDataSet.data = lineSeries.boundary;

      // Get existing data set
      //
      const outsideDataSet = datasets[this.DATASET_OUTSIDE_PROFILE];

      // Overwite it with new line series
      //
      outsideDataSet.data = lineSeries.outside;
    } else {
      // Add new data set
      //
      datasets.push({
        label: 'New Profile Boundary',
        backgroundColor: 'black',
        data: lineSeries.boundary,
      });
    }

    this.chart_.update();
  },

  getStartEndLineSeries: function (newStart = 0, newStop = 0) {
    var boundary = this.getBoundaryLineSeries(newStart, newStop);
    var outside = this.getOutsideLineSeries(newStart, newStop);

    return {
      boundary: boundary,
      outside: outside,
    };
  },

  getBoundaryLineSeries: function (newStart, newStop) {
    var boundaryDataSet = [];
    const divisor = getDivisor(this.longestIteration_);

    const numPointsOnXAxis = this.showAllIterations_
      ? this.chart_.data.labels.length
      : Globals.getIterStop() - Globals.getIterStart() + 1;

    const startIdx = this.showAllIterations_ ? 0 : Globals.getIterStart();
    const endIdx = numPointsOnXAxis + startIdx;

    for (var ii = startIdx; ii < endIdx; ii++) {
      boundaryDataSet.push(
        ii == newStart || ii == newStop
          ? (this.longestIteration_ * this.headRoom_) / divisor
          : 0
      );
    }

    return boundaryDataSet;
  },

  getOutsideLineSeries: function (newStart, newStop) {
    var outside = [];
    const numPointsOnXAxis = this.chart_.data.labels.length;
    const divisor = getDivisor(this.longestIteration_);

    for (var ii = 0; ii < numPointsOnXAxis; ii++) {
      const staticIteration = this.staticIterations_[ii];
      const isOutsideAggregation =
        ii < Globals.getIterStart() || ii > Globals.getIterStop();

      if (isOutsideAggregation) {
        if (!this.showAllIterations_) {
          continue;
        }
        outside.push(
          ii == newStart || ii == newStop
            ? 0
            : staticIteration.duration / divisor
        );
      } else {
        outside.push(0);
      }
    }

    return outside;
  },

  getZoomOptions: function () {
    const zoomOptions = {
      limits: {
        y: {min: 0},
      },
      pan: {
        enabled: true,
        mode: 'y',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: 'y',
        onZoomComplete({chart}) {
          // This update is needed to display up to date zoom level in the title.
          // Without this, previous zoom level is displayed.
          // The reason is: title uses the same beforeUpdate hook, and is evaluated before zoom.
          chart.update('none');
        },
      },
    };

    return zoomOptions;
  },

  getActions: function () {
    const self = this;

    const actions = [
      {
        name: 'Reset zoom',
        handler(chart) {
          chart.resetZoom();
        },
      },
      {
        name: 'Toggle Tooltip',
        handler(chart) {
          self.show_tooltip_ = !self.show_tooltip_;
          chart.update('none');
        },
      },
    ];

    return actions;
  },

  createEvents: function (actions) {
    $('#chartButtons').empty();

    actions.forEach((a, i) => {
      const legendContainer = document.getElementById('chartButtons');
      listContainer = document.createElement('button');
      $listContainer = $(listContainer);
      $listContainer.append(a.name);
      $listContainer.addClass('btn');
      $listContainer.addClass('btn-primary');
      $listContainer.addClass('btn-sm');
      $listContainer.css('margin-left', '5px'); // same as .btn-toolbar>.btn {margin-left}
      listContainer.onclick = () => a.handler(this.chart_);
      legendContainer.appendChild(listContainer);
    });
  },

  fillChart: function () {
    var labels = [];
    var usingTC = [];
    var notUsingTC = [];
    var memory = [];
    var dataloader = [];
    var io = [];
    var cpu = [];
    var other = [];
    var outside = [];
    const yAxisLabelString =
      'Duration (' + getUnits(this.longestIteration_) + ')';
    const divisor = getDivisor(this.longestIteration_);
    const self = this;

    for (
      var ii = 0, profiledIterationIdx = 0;
      ii < this.staticIterations_.length;
      ii++
    ) {
      const staticIteration = this.staticIterations_[ii];
      const isOutsideAggregation =
        ii < Globals.getIterStart() || ii > Globals.getIterStop();

      if (isOutsideAggregation) {
        if (!this.showAllIterations_) {
          continue;
        }
        const duration = staticIteration['duration'];
        usingTC.push(0);
        notUsingTC.push(0);
        memory.push(0);
        dataloader.push(0);
        io.push(0);
        cpu.push(0);
        other.push(0);
        outside.push(duration / divisor);
      } else {
        const profiledIteration = this.getProfiledIteration(ii);

        if (profiledIteration == null) {
          usingTC.push(0);
          notUsingTC.push(0);
          memory.push(0);
          dataloader.push(0);
          io.push(0);
          cpu.push(0);
          other.push(0);
          outside.push(0);
        } else {
          const usingTcDuration = profiledIteration['tc_duration'];
          const noTcDuration = profiledIteration['non_tc_duration'];
          const memoryDuration = profiledIteration['memory_duration'];
          const dataloaderDuration = profiledIteration['dataloader_duration'];
          const ioDuration = profiledIteration['io_duration'];
          const cpuDuration = profiledIteration['cpu_duration'];
          const otherDuration = profiledIteration['other_duration'];

          usingTC.push(numberToDecimal(usingTcDuration / divisor, 2));
          notUsingTC.push(numberToDecimal(noTcDuration / divisor, 2));
          memory.push(numberToDecimal(memoryDuration / divisor, 2));
          dataloader.push(numberToDecimal(dataloaderDuration / divisor, 2));
          io.push(numberToDecimal(ioDuration / divisor, 2));
          cpu.push(numberToDecimal(cpuDuration / divisor, 2));
          other.push(numberToDecimal(otherDuration / divisor, 2));
          outside.push(0);
        }
      }

      labels.push(ii);
    }

    var barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Using Tensor Cores',
          backgroundColor: Globals.GREAT,
          data: usingTC,
        },
        {
          label: 'Not Using Tensor Cores',
          backgroundColor: Globals.GOOD,
          data: notUsingTC,
        },
        {
          label: 'Memory',
          backgroundColor: Globals.OK,
          data: memory,
        },
        {
          label: 'Dataloader',
          backgroundColor: Globals.WARNING1,
          data: dataloader,
        },
        {
          label: 'I/O',
          backgroundColor: Globals.WARNING2,
          data: io,
        },
        {
          label: 'CPU',
          backgroundColor: Globals.WARNING3,
          data: cpu,
        },
        {
          label: 'Other',
          backgroundColor: Globals.BAD,
          data: other,
        },
        {
          label: 'Outside Aggregation',
          backgroundColor: 'lightgrey',
          data: outside,
        },
      ],
    };

    if (this.chart_ != null) {
      this.chart_.destroy();
    }

    const actions = self.getActions();
    self.createEvents(actions);
    const zoomOptions = self.getZoomOptions();
    const zoomStatus = (chart) =>
      (zoomOptions.zoom.wheel.enabled ? 'enabled' : 'disabled') +
      ' (' +
      chart.getZoomLevel() +
      'x)';
    const tooltipStatus = () => (self.show_tooltip_ ? 'enabled' : 'disabled');

    this.chart_ = new Chart(this.ctx_, {
      type: 'bar',
      data: barChartData,
      options: {
        actions: actions,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            filter: function (tooltipItem) {
              return (
                self.show_tooltip_ === true &&
                tooltipItem.datasetIndex !== self.DATASET_PROFILE_BOUNDARY
              );
            },
          },
          zoom: zoomOptions,
          title: {
            display: true,
            position: 'bottom',
            text: (ctx) =>
              'Zoom: ' +
              zoomStatus(ctx.chart) +
              ', tooltip: ' +
              tooltipStatus(),
          },
        },
        animation: false,
        responsive: true,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Iterations',
            },
          },
          y: {
            beginAtZero: true,
            stacked: true,
            max: (this.longestIteration_ * this.headRoom_) / divisor,
            title: {
              display: true,
              text: yAxisLabelString,
            },
          },
        },
      },
    });
  },
};
