/* !@file IterationSummaryPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function IterationSummaryPanel() {
  this.TABLE_ITERATION_SUMMARY_ITERATION = 0;
  this.TABLE_ITERATION_TIMESTAMP = 1;
  this.TABLE_ITERATION_DURATION = 2;
  this.TABLE_ITERATION_SUMMARY_TOTAL_KERNELS = 3;
  this.TABLE_ITERATION_SUMMARY_TC_KERNELS = 4;
  this.TABLE_ITERATION_SUMMARY_TOTAL_GPU_TIME = 5;
  this.TABLE_ITERATION_SUMMARY_TC_GPU_TIME = 6;
  this.iterationSummaryDataTable_ = null;
  this.iterationSummaryPanelOpen_ = {val: true};
  this.divisor_ = 1;
  this.tableSelector_ = '';
  this.aggrID_ = '';
  this.domainName_ = '';
  this.longestIterationDuration_ = 0;
  this.previousAggrID_ = null;
  this.previousDomainName_ = null;
  this.searchableColumns_ = [
    this.TABLE_ITERATION_SUMMARY_ITERATION,
    this.TABLE_ITERATION_TIMESTAMP,
    this.TABLE_ITERATION_DURATION,
    this.TABLE_ITERATION_SUMMARY_TOTAL_KERNELS,
    this.TABLE_ITERATION_SUMMARY_TC_KERNELS,
  ];

  this.titleGpuMain_ =
    'GPU Time (<span class="iterationSummaryTableUnits">ns</span>)';
  this.titleGpu_ =
    Globals.getGpuCount() == 1
      ? 'Total ' + this.titleGpuMain_
      : 'Average ' + this.titleGpuMain_;

  this.titleTcMain_ =
    'TC GPU Time (<span class="iterationSummaryTableUnits">ns</span>)';
  this.titleTcGpu_ =
    Globals.getGpuCount() == 1
      ? 'Total ' + this.titleTcMain_
      : 'Average ' + this.titleTcMain_;
}

IterationSummaryPanel.prototype = {
  constructor: IterationSummaryPanel,

  initIterationSummaryPanel: function (
    aggrID,
    domainName,
    chevronSelector,
    panelSelector,
    tableSelector,
    childPanel,
    callback
  ) {
    // Rename selectors so that DOM can be re-used by multiple views
    //
    $('#iterationSummaryChevron').prop('id', chevronSelector);
    $('#iterationSummaryPanel').prop('id', panelSelector);
    $('#iterationSummaryTable').prop('id', tableSelector);

    loadChevronEvents(
      '#' + chevronSelector,
      '#' + panelSelector,
      this.iterationSummaryPanelOpen_
    );
    this.tableSelector_ = '#' + tableSelector;
    this.initIterationSummaryTable(aggrID, domainName);

    this.setIterationSummaryTableSelectionListener(this, childPanel, callback);
    this.setIterationViewListener();
  },

  setIterationViewListener: function () {
    const self = this;

    // https://learn.jquery.com/events/introduction-to-custom-events/
    //
    $('#IterationSummaryByIteration')
      .unbind()
      .on('kernelIterationSelectEvent', function (event, staticIterationVal) {
        // Get the page info of the table, specifically the pagination size.
        //
        const info = self.iterationSummaryDataTable_.page.info();

        self.iterationSummaryDataTable_
          .rows()
          .every(function (rowIdx, tableLoop, rowLoop) {
            const data = this.data();
            const staticIterationValInRow =
              data[self.TABLE_ITERATION_SUMMARY_ITERATION];

            if (staticIterationVal == staticIterationValInRow) {
              var rowCounterWithinPage = rowLoop;
              while (rowCounterWithinPage >= info.length) {
                rowCounterWithinPage -= info.length;
              }

              // Scroll this row into view
              // Uses plugin https://datatables.net/plug-ins/api/row().show()
              //
              this.show().draw(false);

              // Trigger a click event on the row.
              // This will call the event inside setIterationSummaryTableSelectionListener() below
              //
              const finder = 'tbody tr:eq(' + rowCounterWithinPage + ')';
              $(self.tableSelector_).find(finder).trigger('click');
            }
          });
      });
  },

  initIterationSummaryTable: function (aggrID, domainName) {
    const self = this;
    self.aggrID_ = aggrID;
    self.domainName_ = domainName;

    if (this.iterationSummaryDataTable_ == null) {
      this.iterationSummaryDataTable_ = $(this.tableSelector_).DataTable({
        destroy: true,
        bProcessing: true,
        bServerSide: true,
        bjQueryUI: true,
        sAjaxSource: 'dlprof/datatable/iteration_summary_datatable',
        sAjaxDataProp: 'iterationSummaryProp',
        fnServerParams: function (aoData) {
          aoData.push({name: 'aggregation', value: self.aggrID_});
          aoData.push({name: 'domain', value: self.domainName_});
        },
        fnDrawCallback: function () {
          const isTableEmpty = this.fnSettings().fnRecordsTotal() === 0;

          isTableEmpty
            ? $('#iterationSummaryClickInstructions').hide()
            : $('#iterationSummaryClickInstructions').show();

          isTableEmpty
            ? $('#iterationSummaryTableByIteration_wrapper').hide()
            : $('#iterationSummaryTableByIteration_wrapper').show();

          isTableEmpty
            ? $('#kernelsByIterationPanel').hide()
            : $('#kernelsByIterationPanel').show();

          isTableEmpty
            ? $('#iterationSummaryPanelByNode').hide()
            : $('#iterationSummaryPanelByNode').show();

          isTableEmpty
            ? $('#iterationSummaryPanelByIteration').hide()
            : $('#iterationSummaryPanelByIteration').show();

          isTableEmpty
            ? $('#opsInIterationParentPanel').hide()
            : $('#opsInIterationParentPanel').show();

          isTableEmpty
            ? $('#kernelsInOpParentPanel').hide()
            : $('#kernelsInOpParentPanel').show();
        },
        dom: getDatatablesDom(),
        buttons: getDatatableButtons(
          Globals.getProfileName() + ' Iteration Summary'
        ),
        orderCellsTop: true,
        fixedHeader: true,
        select: true,
        columns: [
          {data: 'iter_value'},
          {data: 'start_time'},
          {data: 'duration'},
          {data: 'total_kernel_count'},
          {data: 'using_tc_kernel_count'},
          {data: 'average_gpu_total'},
          {data: 'average_gpu_time_using_tc'},
        ],
        aoColumnDefs: [
          {
            aTargets: [
              this.TABLE_ITERATION_SUMMARY_ITERATION,
              this.TABLE_ITERATION_TIMESTAMP,
              this.TABLE_ITERATION_DURATION,
              this.TABLE_ITERATION_SUMMARY_TOTAL_KERNELS,
              this.TABLE_ITERATION_SUMMARY_TC_KERNELS,
              this.TABLE_ITERATION_SUMMARY_TOTAL_GPU_TIME,
              this.TABLE_ITERATION_SUMMARY_TC_GPU_TIME,
            ],
            sClass: 'dt-body-right dt-head-center',
          },
          {
            aTargets: [
              this.TABLE_ITERATION_SUMMARY_TOTAL_GPU_TIME,
              this.TABLE_ITERATION_SUMMARY_TC_GPU_TIME,
            ],
            render: function (data, type, row, meta) {
              const gpuTimeNumerator = data / self.divisor_;
              const gpuTimeDenominator = numberToDecimal(
                row['duration'] / self.divisor_,
                Globals.MANTISSA_LENGTH
              );
              const gpuTimeProgress = getProgressCell(
                gpuTimeNumerator,
                gpuTimeDenominator
              );
              return gpuTimeProgress;
            },
          },
          {
            aTargets: [this.TABLE_ITERATION_SUMMARY_TOTAL_GPU_TIME],
            title: self.titleGpu_,
          },
          {
            aTargets: [this.TABLE_ITERATION_SUMMARY_TC_GPU_TIME],
            title: self.titleTcGpu_,
          },
          {
            aTargets: [
              this.TABLE_ITERATION_TIMESTAMP,
              this.TABLE_ITERATION_SUMMARY_TOTAL_KERNELS,
              this.TABLE_ITERATION_SUMMARY_TC_KERNELS,
            ],
            render: function (data, type, row, meta) {
              return (
                '<span class="cudaNoWrap">' +
                getRenderableNumber(data) +
                '</span>'
              );
            },
          },
          {
            aTargets: [this.TABLE_ITERATION_DURATION],
            render: function (data, type, row, meta) {
              const iterationDuration = numberToDecimal(
                data / self.divisor_,
                Globals.MANTISSA_LENGTH
              );

              return (
                '<span class="cudaNoWrap">' + iterationDuration + '</span>'
              );
            },
          },
          {
            aTargets: ['sortDescFirst'],
            asSorting: ['desc', 'asc'],
          },
        ],
      });

      initColumnFiltering(this.tableSelector_);
      prependExportLabel();
      setupColumnFiltering(
        this.tableSelector_,
        this.iterationSummaryDataTable_,
        this.searchableColumns_
      );
    } else {
      this.iterationSummaryDataTable_.draw();
    }

    this.updateUnits(aggrID, domainName);
  },

  fillIterationSummaryPanel: function (aggrID, domainName) {
    $(document).ready(function () {
      if (Globals.getGpuCount() == 1) {
        $('.iterationSummaryAverageInfo').hide();
      } else {
        $('.iterationSummaryAverageInfo').show();
      }
    });

    // This function can be called from multiple places.
    // Change this panel's contents only if the values
    // in the ITERATIONS or DOMAINS droplist changed.
    //
    if (this.didEitherDroplistChange(aggrID, domainName)) {
      this.updateUnits(aggrID, domainName);
      this.initIterationSummaryTable(aggrID, domainName);
    }
  },

  updateUnits: function (aggrID, domainName) {
    this.previousAggrID_ = aggrID;
    this.previousDomainName_ = domainName;
    this.longestIterationDuration_ = getLongestDurationSynchronous(
      aggrID,
      domainName
    ).duration;
    this.divisor_ = getDivisor(this.longestIterationDuration_);
    const units = getUnits(this.longestIterationDuration_);
    $('.iterationSummaryTableUnits').html(units);
  },

  didEitherDroplistChange: function (aggrID, domainName) {
    return (
      aggrID != this.previousAggrID_ || domainName != this.previousDomainName_
    );
  },

  setIterationSummaryTableSelectionListener: function (
    parentPanel,
    childPanel,
    callback
  ) {
    const dataTable = this.iterationSummaryDataTable_;
    const self = this;

    $(this.tableSelector_ + ' tbody')
      .unbind()
      .on('click', 'tr', function () {
        $(self.tableSelector_ + ' tr').removeClass('row_selected');
        $(this).addClass('row_selected');

        const profiledIterationValue = this._DT_RowIndex;
        const iterValue = getIterationData(dataTable, this, 'iter_value');
        const iterDuration = getIterationData(dataTable, this, 'duration');

        callback(
          childPanel,
          self.aggrID_,
          self.domainName_,
          iterValue,
          iterDuration
        );
      });

    function getIterationData(dataTable, tr, column) {
      var data = dataTable.row(tr).data();
      return data[column];
    }
  },
};
