/* !@file DLprofPieChart.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function DLprofPieChart(labels, colors, selector, legendID) {
  this.labels_ = labels;
  this.colors_ = colors;
  this.ctx_ = $(selector);
  this.selector_ = selector;
  this.legendID_ = legendID;

  this.options_ = {
    tooltips: {
      bodyFontSize: 10,
    },
    plugins: {
      htmlLegend: {
        containerID: legendID,
      },
      legend: {
        display: false,
      },
    },
  };
}

DLprofPieChart.prototype = {
  constructor: DLprofPieChart,

  draw: function (model) {
    if (this.chart_ != null) {
      this.chart_.destroy();
    }

    this.chart_ = new Chart(this.ctx_, {
      type: 'doughnut',
      data: {
        labels: this.labels_,
        datasets: [
          {
            data: model,
            backgroundColor: this.colors_,
          },
        ],
      },
      options: this.options_,
      plugins: [htmlLegendPlugin],
    });
  },
};

const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    $listContainer = $(listContainer);
    $listContainer.addClass('' + chart.id + '-legend');
    $listContainer.addClass('chartjs-legend');

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);
    const $ul = $(ul);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    // Reuse the built-in legendItems generator
    //
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    items.forEach(function (item, i) {
      const li = document.createElement('li');
      const $li = $(li);

      $li.append(
        '<span style="background-color:' +
          chart.data.datasets[0].backgroundColor[i] +
          '"></span>'
      );

      $li.css('background-color:', 'relative');
      $li.append(item.text);
      $li.addClass(item.hidden ? 'legend-hidden' : '');

      li.onclick = () => {
        chart.toggleDataVisibility(item.index);
        chart.update();
      };

      $ul.append($li);
    });
  },
};
