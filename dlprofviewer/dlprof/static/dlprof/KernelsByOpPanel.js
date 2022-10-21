/* !@file KernelsByOpPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function KernelsByOpPanel() {
  document.title = 'DLProf: Kernels by Op';

  this.kbnSummaryPanel_ = new IterationSummaryPanel();
  this.opsInIterationDataTable_ = null;
  this.kernelsInOpDataTable_ = null;
  this.opsInIterationTableOpen_ = {val: true};
  this.kernelsInOpTableOpen_ = {val: true};
  this.kernelsByOpsLoaded_ = false;
  this.divisor_ = 1;
  this.aggrID_ = null;
  this.domainName_ = null;
  this.iterValue_ = -1;
  this.opID_ = '';
  this.opName_ = '';

  this.COL_OP_ID = 0;
  this.COL_OP_NAME = 1;
  this.COL_DIRECTION = 2;
  this.COL_OP_TYPE = 3;
  this.COL_TOTAL_KERNELS = 4;
  this.COL_TC_KERNELS = 5;
  this.COL_OP_GPU_TIME = 6;
  this.COL_TC_TIME = 7;
  this.COL_TC_DATA_TYPE = 8;
  this.COL_STACK_TRACE = 9;

  this.searchableOpsCols_ = [
    this.COL_OP_ID,
    this.COL_OP_NAME,
    this.COL_DIRECTION,
    this.COL_OP_TYPE,
    this.COL_TOTAL_KERNELS,
    this.COL_TC_KERNELS,
    this.COL_OP_GPU_TIME,
    this.COL_TC_TIME,
    this.COL_TC_DATA_TYPE,
    this.COL_STACK_TRACE,
  ];

  this.dtOpsSelector_ = '#datatableOpsInIteration';

  this.COL_KERNEL_NAME = 0;
  this.COL_DEVICE_ID = 1;
  this.COL_TIMESTAMP = 2;
  this.COL_KERNEL_GPU_TIME = 3;
  this.COL_USING_TC = 4;
  this.COL_GRID = 5;
  this.COL_BLOCK = 6;

  this.searchableKernelCols_ = [
    this.COL_KERNEL_NAME,
    this.COL_DEVICE_ID,
    this.COL_TIMESTAMP,
    this.COL_KERNEL_GPU_TIME,
    this.COL_USING_TC,
    this.COL_GRID,
    this.COL_BLOCK,
  ];

  this.booleanKernelCols_ = [this.COL_USING_TC];
  this.dtKernelsSelector_ = '#datatableKernelsInOp';

  loadChevronEvents(
    '#opsInIterationTableChevron',
    '#opsInIterationTablePanel',
    this.opsInIterationTableOpen_
  );
  loadChevronEvents(
    '#kernelsInOpTableChevron',
    '#kernelsInOpTablePanel',
    this.kernelsInOpTableOpen_
  );
}

KernelsByOpPanel.prototype = {
  constructor: KernelsByOpPanel,

  fill: function (aggrID, domainName) {
    this.aggrID_ = aggrID;
    this.domainName_ = domainName;
    this.iterValue_ = -1;
    this.opID_ = '';
    this.opName_ = '';

    if (!this.kernelsByOpsLoaded_) {
      this.kernelsByOpsLoaded_ = true;

      this.kbnSummaryPanel_.initIterationSummaryPanel(
        aggrID,
        domainName,
        'iterationSummaryChevronByNode',
        'iterationSummaryPanelByNode',
        'iterationSummaryTableByNode',
        this,
        this.iterationSummaryTableListenerByOp
      );

      this.createOpsInIterationTable();
      this.setOpsInIterationSelectionListener(this);
    }

    this.updateOpsByIteration();
  },

  setOpsInIterationSelectionListener: function (self) {
    $(self.dtOpsSelector_ + ' tbody')
      .unbind()
      .on('click', 'tr', function () {
        $(self.dtOpsSelector_ + ' tr').removeClass('row_selected');
        $(this).addClass('row_selected');

        var data = self.opsInIterationDataTable_.row(this).data();
        if (data != null) {
          self.opID_ = data['op_node_id'];
          self.opName_ = data['op_node_name'];
          self.updateKernelsInOp();
        }
      });
  },

  updateOpsByIteration: function () {
    this.kbnSummaryPanel_.fillIterationSummaryPanel(
      this.aggrID_,
      this.domainName_
    );
    this.updateOpsInIteration();
  },

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (e, aggrID, domainName) {
    const self = this;
    self.fill(aggrID, domainName);
  },

  // This callback function is called when a row is selected in the iteration summary table
  //
  iterationSummaryTableListenerByOp: function (
    self,
    aggrID,
    domainName,
    iterValue
  ) {
    self.aggrID_ = aggrID;
    self.domainName_ = domainName;
    self.iterValue_ = iterValue;
    self.opID_ = '';
    self.opName_ = '';

    self.updateOpsInIteration();
    self.updateKernelsInOp();
  },

  updateOpsInIteration: function () {
    this.createOpsInIterationTable();
    this.createKernelsInOpTable();

    if (this.iterValue_ == -1) {
      $('#clickAnOp').hide();
      $('#iterationAndOpSelectionDescription').hide();
    } else {
      $('#clickAnOp').show();
      $('#iterationSelectionDescriptionOp').text(
        'Here are the ops for iteration ' + this.iterValue_
      );
    }
  },

  createOpsInIterationTable: function () {
    const self = this;

    const title =
      Globals.getProfileName() +
      (self.iterValue_ == -1
        ? ' Ops by Iteration'
        : ' Ops in Iteration ' + self.iterValue_);

    if (self.opsInIterationDataTable_ == null) {
      self.opsInIterationDataTable_ = $(self.dtOpsSelector_).DataTable({
        destroy: true,
        bProcessing: true,
        bServerSide: true,
        bjQueryUI: true,
        sAjaxSource: 'dlprof/datatable/iteration_ops_datatable',
        sAjaxDataProp: 'iterationOpsProp',
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
        order: [self.COL_OP_GPU_TIME, 'desc'], // pre-sort
        columns: [
          {data: 'op_node_id'},
          {data: 'op_node_name'},
          {data: 'direction'},
          {data: 'op_node_type'},
          {data: 'total_count'},
          {data: 'tc_count'},
          {data: 'total_gpu_time'},
          {data: 'tc_gpu_time'},
          {data: 'data_type'},
          {data: 'stack_trace'},
        ],

        aoColumnDefs: [
          {
            aTargets: [self.COL_OP_NAME],
            width: '20%',
            createdCell: function (td, cellData, rowData, row, col) {
              addSeeMoreLessToCell(td);
            },
          },
          {
            aTargets: [self.COL_OP_ID],
            width: '10%',
          },
          {
            aTargets: [self.COL_DIRECTION],
            visible: Globals.isPytorchFramework(),
            render: function (data, type, row, meta) {
              return '<span class="cudaNoWrap">' + data + '</span>';
            },
          },
          {
            aTargets: [
              self.COL_OP_GPU_TIME,
              self.COL_TC_TIME,
            ],
            sClass: 'dt-body-right dt-head-center',
            width: '1%',
            render: function (data, type, row, meta) {
              return getRenderableNumber(data);
            },
          },
          {
            aTargets: [self.COL_TOTAL_KERNELS, self.COL_TC_KERNELS],
            sClass: 'dt-body-right dt-head-center',
            width: '1%',
            render: function (data, type, row, meta) {
              return getRenderableNumber(data);
            },
          },
          {
            aTargets: [self.COL_STACK_TRACE],
            visible: Globals.isPytorchFramework(),
            render: function (data, type, row, meta) {
              return type === 'export'
                ? data.replace(/\n/g, ';')
                : data.replace(/\n/g, '<br>');
            },
            createdCell: function (td, cellData, rowData, row, col) {
              addSeeMoreLessToCell(td);
            },
            width: '10%',
          },
          {
            aTargets: [],
            sClass: 'dt-center',
          },
          {
            aTargets: ['sortDescFirst'],
            asSorting: ['desc', 'asc'],
          },
        ],
      });

      initColumnFiltering(this.dtOpsSelector_);
      prependExportLabel();
      setupColumnFiltering(
        self.dtOpsSelector_,
        self.opsInIterationDataTable_,
        self.searchableOpsCols_
      );
    } else {
      self.opsInIterationDataTable_.draw();
    }
  },

  createKernelsInOpTable: function () {
    const self = this;

    const title =
      Globals.getProfileName() +
      (self.iterValue_ == -1 || self.opName_ == ''
        ? ' Kernels by Op and Iteration'
        : ' Kernels in Iteration ' +
          self.iterValue_ +
          ' and Op ' +
          self.opName_);

    if (self.kernelsInOpDataTable_ == null) {
      self.kernelsInOpDataTable_ = $(self.dtKernelsSelector_).DataTable({
        destroy: true,
        bProcessing: true,
        bServerSide: true,
        bjQueryUI: true,
        sAjaxSource: 'dlprof/datatable/iteration_op_kernels_datatable',
        sAjaxDataProp: 'iterationOpKernelsProp',
        fnServerParams: function (aoData) {
          aoData.push({name: 'aggregation', value: self.aggrID_});
          aoData.push({name: 'domain', value: self.domainName_});
          aoData.push({name: 'iterValue', value: self.iterValue_});
          aoData.push({name: 'opID', value: self.opID_});
        },
        dom: getDatatablesDom(),
        orderCellsTop: true,
        fixedHeader: true,
        select: true,
        buttons: getDatatableButtons(title, 'landscape'),
        autoWidth: false,
        language: {
          emptyTable: 'Click an op in the table above',
        },
        order: [this.COL_KERNEL_GPU_TIME, 'desc'], // pre-sort
        columns: [
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
            aTargets: [this.COL_DEVICE_ID],
            sClass: 'dt-center',
            width: '5%',
          },
          {
            aTargets: [this.COL_TIMESTAMP, this.COL_KERNEL_GPU_TIME],
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
            sClass: 'dt-nowrap',
            width: '5%',
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

      initColumnFiltering(this.dtKernelsSelector_);
      prependExportLabel();
      setupColumnFiltering(
        this.dtKernelsSelector_,
        this.kernelsInOpDataTable_,
        this.searchableKernelCols_,
        this.booleanKernelCols_
      );
    } else {
      self.kernelsInOpDataTable_.draw();
    }
  },

  updateKernelsInOp: function () {
    if (this.iterValue_ == -1 || this.opName_ == '') {
      $('#iterationAndOpSelectionDescription').hide();
    } else {
      $('#iterationAndOpSelectionDescription').show();
      $('#iterationAndOpSelectionDescription').html(
        'Here are the kernels for iteration <strong>' +
          this.iterValue_ +
          '</strong> and op <strong>' +
          this.opName_ +
          '</strong>'
      );
    }

    this.createKernelsInOpTable();
  },
};
