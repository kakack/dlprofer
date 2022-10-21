/* !@file KernelsByIterationPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function KernelsByIterationPanel() {
  document.title = 'DLProf: Kernels by Iteration';

  this.kbiSummaryPanel_ = new IterationSummaryPanel();
  this.kernelsInIterationDataTable_ = null;
  this.kernelsByIterationLoaded_ = false;
  this.iterationDuration_ = 0; // duration of selected iteration from parent table
  this.divisor_ = 1;
  this.domainName_ = null;
  this.iterValue_ = null;

  this.COL_OP_NAME = 0;
  this.COL_KERNEL_NAME = 1;
  this.COL_DEVICE_ID = 2;
  this.COL_TIMESTAMP = 3;
  this.COL_GPU_TIME = 4;
  this.COL_USING_TC = 5;
  this.COL_GRID = 6;
  this.COL_BLOCK = 7;

  this.searchableColumns_ = [
    this.COL_OP_NAME,
    this.COL_KERNEL_NAME,
    this.COL_DEVICE_ID,
    this.COL_TIMESTAMP,
    this.COL_GPU_TIME,
    this.COL_USING_TC,
    this.COL_GRID,
    this.COL_BLOCK,
  ];

  this.booleanColumns_ = [this.COL_USING_TC];
  this.dtSelector_ = '#datatableKernelsInIteration';
}

KernelsByIterationPanel.prototype = {
  constructor: KernelsByIterationPanel,

  fill: function (aggrID, domainName) {
    if (!this.kernelsByIterationLoaded_) {
      this.kernelsByIterationLoaded_ = true;

      this.kbiSummaryPanel_.initIterationSummaryPanel(
        aggrID,
        domainName,
        'iterationSummaryChevronByIteration',
        'iterationSummaryPanelByIteration',
        'iterationSummaryTableByIteration',
        this,
        this.iterationSummaryTableListenerByKernel
      );

      this.kbiSummaryPanel_.fillIterationSummaryPanel(aggrID, domainName);
    }

    this.updateKernelsByIteration(aggrID, domainName);
  },

  updateKernelsByIteration: function (aggrID, domainName) {
    this.kbiSummaryPanel_.fillIterationSummaryPanel(aggrID, domainName);
    this.updateKernelsInIteration(aggrID, domainName);
  },

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (e, aggrID, domainName) {
    const self = this;
    self.fill(aggrID, domainName);
  },

  // This callback function is called when
  // 1) a row is selected in the iteration summary table
  // 2) an iteration is selected in the iteration view
  //
  iterationSummaryTableListenerByKernel: function (
    self,
    aggrID,
    domainName,
    iterValue,
    iterationDuration
  ) {
    self.iterationDuration_ = iterationDuration;
    self.updateKernelsInIteration(aggrID, domainName, iterValue);
  },

  // Public method, called by selecting an interation in the iteration view
  //
  selectIteration: function (iterationValue, iterationDuration) {
    this.iterationSummaryTableListenerByKernel(
      this,
      iterationValue,
      iterationDuration
    );
  },

  updateKernelsInIteration: function (aggrID, domainName, iterValue) {
    this.createKernelsInIterationTable(aggrID, domainName, iterValue);

    if (iterValue == null) {
      $('#iterationSelectionDescriptionKernel').hide();
    } else {
      $('#iterationSelectionDescriptionKernel').show();
      $('#iterationSelectionDescriptionKernel').html(
        'Here are the kernels for iteration <strong>' + iterValue + '</strong>'
      );
    }
  },

  createKernelsInIterationTable: function (aggrID, domainName, iterValue = -1) {
    const self = this;
    self.aggrID_ = aggrID;
    self.domainName_ = domainName;
    self.iterValue_ = iterValue;

    const title =
      Globals.getProfileName() +
      (iterValue == -1
        ? ' Kernels by Iteration'
        : ' Kernels in Iteration ' + iterValue);

    if (this.kernelsInIterationDataTable_ == null) {
      this.kernelsInIterationDataTable_ = $(this.dtSelector_).DataTable({
        destroy: true,
        bProcessing: true,
        bServerSide: true,
        bjQueryUI: true,
        sAjaxSource: 'dlprof/datatable/iteration_kernels_datatable',
        sAjaxDataProp: 'iterationKernelsProp',
        fnServerParams: function (aoData) {
          aoData.push({name: 'aggregation', value: self.aggrID_});
          aoData.push({name: 'domain', value: self.domainName_});
          aoData.push({name: 'iterValue', value: self.iterValue_});
        },
        dom: getDatatablesDom(),
        orderCellsTop: true,
        fixedHeader: true,
        select: true,
        buttons: getDatatableButtons(title, 'landscape'),
        autoWidth: false,
        language: {
          emptyTable: 'Click an iteration in the table above',
        },
        order: [this.COL_GPU_TIME, 'desc'], // pre-sort
        columns: [
          {data: 'op_node_name'},
          {data: 'kernel_name'},
          {data: 'device_id'},
          {data: 'kernel_timestamp'},
          {data: 'kernel_duration'},
          {data: 'uses_tc'},
          {data: 'grid'},
          {data: 'block'},
        ],

        aoColumnDefs: [
          {
            aTargets: [this.COL_TIMESTAMP, this.COL_GPU_TIME],
            sClass: 'dt-body-right dt-head-center',
          },
          {
            aTargets: [this.COL_KERNEL_NAME],
            render: function (data, type, row, meta) {
              return '<span class="cudaNoWrap">' + data + '</span>';
            },
          },
          {
            aTargets: [this.COL_DEVICE_ID],
            sClass: 'dt-center',
            width: '5%',
          },
          {
            aTargets: [this.COL_TIMESTAMP, this.COL_GPU_TIME],
            sClass: 'dt-nowrap dt-body-right dt-head-center',
            render: function (data, type, row, meta) {
              return getRenderableNumber(data);
            },
          },
          {
            aTargets: [this.COL_USING_TC],
            sClass: 'dt-center',
            width: '5%',
            render: function (data, type, row, meta) {
              if (type == 'export') {
                return data == 1 ? 'true' : 'false';
              } else {
                return data == 1 ? Globals.faCheck : Globals.faTimes;
              }
            },
          },
          {
            aTargets: [this.COL_GRID, this.COL_BLOCK],
            sClass: 'dt-nowrap dt-head-center',
            render: function (data, type, row, meta) {
              return '(' + data + ')';
            },
          },
          {
            aTargets: ['sortDescFirst'],
            asSorting: ['desc', 'asc'],
          },
        ],
      });

      initColumnFiltering(this.dtSelector_);
      prependExportLabel();
      setupColumnFiltering(
        this.dtSelector_,
        this.kernelsInIterationDataTable_,
        this.searchableColumns_,
        this.booleanColumns_
      );
    } else {
      this.kernelsInIterationDataTable_.draw();
    }
  },
};
