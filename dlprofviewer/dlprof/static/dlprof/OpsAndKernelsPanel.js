/* !@file OpsAndKernelsPanel.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function OpsAndKernelsPanel() {
  document.title = 'DLProf: Ops and Kernels';

  this.allOpsDataTable = null;
  this.kernelSummaryDataTable = null;
  this.opTableOpen = {val: true};
  this.kernelsTableOpen = {val: true};
  this.aggrID_ = '';
  this.domainName_ = '';
  this.opID_ = '';

  this.COL_GPU_TIME = 0;
  this.COL_CPU_TIME = 1;
  this.COL_OP_ID = 2;
  this.COL_OP_NAME = 3;
  this.COL_DIRECTION = 4;
  this.COL_OP_TYPE = 5;
  this.COL_CALLS = 6;
  this.COL_TC_ELIGIBLE = 7;
  this.COL_USING_TC = 8;
  this.COL_KERNEL_CALLS = 9;
  this.COL_DATA_TYPE = 10;
  this.COL_STACK_TRACE = 11;

  this.TABLE_KERNEL_SUMMARY_KERNEL_NAME = 0;
  this.TABLE_KERNEL_SUMMARY_USING_TC = 1;
  this.TABLE_KERNEL_SUMMARY_CALLS = 2;
  this.TABLE_KERNEL_SUMMARY_GPU_TIME = 3;
  this.TABLE_KERNEL_SUMMARY_AVG = 4;
  this.TABLE_KERNEL_SUMMARY_MIN = 5;
  this.TABLE_KERNEL_SUMMARY_MAX = 6;

  this.showBadDataTypeOps_ = false;
  this.showOnlyBadOpsButtonToggle_ = false;
  this.dtOpsSelector_ = '#datatableAllOps';
  this.dtKernelSelector_ = '#datatableKernelSummary';

  // this.atLeastOneBadOp_ = false;   // TODO(cvinson) reimplement this
  this.booleanOpCols_ = [this.COL_TC_ELIGIBLE, this.COL_USING_TC];
  this.booleanKernelCols_ = [this.TABLE_KERNEL_SUMMARY_USING_TC];
}

OpsAndKernelsPanel.prototype = {
  constructor: OpsAndKernelsPanel,

  fill: function (aggrID, domainName) {
    problem = getStorage(Globals.EXP_SYS_PROBLEM_KEY);
    recommendation = getStorage(Globals.EXP_SYS_RECOMMENDATION_KEY);

    showBadDataTypeOps =
      problem.length > 1 && recommendation.length > 1 ? true : false;

    this.aggrID_ = aggrID;
    this.domainName_ = domainName;
    this.opID_ = '';
    this.showBadDataTypeOps_ = showBadDataTypeOps;
    this.showOnlyBadOpsButtonToggle_ = showBadDataTypeOps;

    loadChevronEvents('#opsTableChevron', '#opsTablePanel', this.opTableOpen);
    loadChevronEvents(
      '#kernelsTableChevron',
      '#kernelsTablePanel',
      this.kernelsTableOpen
    );

    $('#problem').html(problem);
    $('#recommendation').html(recommendation);

    this.initAllOpsTable();
    this.initKernelSummaryTable();
    this.setAllOpsSelectionListener();
    this.setButtonListeners();

    if (
      this
        .showOnlyBadOpsButtonToggle_ /* && this.atLeastOneBadOp_ (<------ TODO(cvinson) restore this lowpri feature) */
    ) {
      $('.badOpSelector').show();
    } else {
      $('.badOpSelector').hide();
    }

    this.updateButtonStates();
  },

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (e, aggrID, domainName) {
    const self = this;
    self.fill(aggrID, domainName);
  },

  setButtonListeners: function () {
    const self = this;

    $('#showBadOpsButton')
      .unbind()
      .click(function (e) {
        self.showBadOps();
      });

    $('#showAllOpsButton')
      .unbind()
      .click(function (e) {
        self.showAllOps();
      });
  },

  initAllOpsTable: function () {
    const self = this;

    if (self.allOpsDataTable == null) {
      self.allOpsDataTable = self.createOpsDataTable(
        self.dtOpsSelector_,
        this.aggrID_,
        this.domainName_
      );
    } else {
      self.allOpsDataTable.draw();
      self.initKernelSummaryTable();
    }
  },

  createOpsDataTable: function (
    selector,
    aggrID,
    domainName,
    showExportButtons = true
  ) {
    const self = this;

    self.aggrID_ = aggrID;
    self.domainName_ = domainName;

    const datatable = $(selector).DataTable({
      destroy: true,
      bProcessing: true,
      bServerSide: true,
      bjQueryUI: true,
      sAjaxSource: 'dlprof/datatable/ops_datatable',
      sAjaxDataProp: 'opsProp',
      orderCellsTop: true,
      fixedHeader: true,
      select: true,
      autoWidth: false,
      order: [self.COL_GPU_TIME, 'desc'], // pre-sort
      dom: getDatatablesDom(),

      columns: [
        {data: 'gpu_time'},
        {data: 'cpu_time'},
        {data: 'op_node_id'},
        {data: 'op_node_name'},
        {data: 'direction'},
        {data: 'op_node_type'},
        {data: 'num_calls'},
        {data: 'tc_eligible'},
        {data: 'using_tc'},
        {data: 'kernel_calls'},
        {data: 'data_type'},
        {data: 'stack_trace'},
      ],
      buttons: showExportButtons
        ? getDatatableButtons(
            Globals.getProfileName() + ' Ops',
            'landscape',
            true
          )
        : [],
      fnServerParams: function (aoData) {
        aoData.push({name: 'aggregation', value: self.aggrID_});
        aoData.push({name: 'domain', value: self.domainName_});
        aoData.push({
          name: 'showBadDataTypeOps',
          value: self.showBadDataTypeOps_,
        });
        aoData.push({
          name: 'showOnlyBadOps',
          value: self.showOnlyBadOpsButtonToggle_,
        });
      },
      aoColumnDefs: [
        {
          aTargets: ['sortDescFirst'],
          asSorting: ['desc', 'asc'],
        },
        {
          aTargets: [self.COL_OP_ID],
          width: '10%',
        },
        {
          aTargets: [self.COL_OP_NAME],
          createdCell: function (td, cellData, rowData, row, col) {
            addSeeMoreLessToCell(td);
          },
        },
        {
          aTargets: [self.COL_DIRECTION],
          visible: Globals.isPytorchFramework(),
        },
        {
          aTargets: [self.COL_TC_ELIGIBLE, self.COL_USING_TC],
          render: function (data, type, row, meta) {
            if (type == 'export') {
              return data == 1 ? 'true' : 'false';
            } else {
              return data == 1 ? Globals.faCheck : Globals.faTimes;
            }
          },
        },
        {
          aTargets: [
            self.COL_GPU_TIME,
            self.COL_CPU_TIME,
            self.COL_KERNEL_CALLS,
          ],
          sClass: 'dt-body-right dt-head-center',
          render: function (data, type, row, meta) {
            return (
              '<span class="cudaNoWrap">' +
              getRenderableNumber(data) +
              '</span>'
            );
          },
        },
        {
          aTargets: [
            self.COL_CALLS,
            self.COL_TC_ELIGIBLE,
            self.COL_USING_TC,
            self.COL_KERNEL_CALLS,
          ],
          sClass: 'dt-center',
        },
        {
          aTargets: [self.COL_DATA_TYPE],
          render: function (data, type, row, meta) {
            const showAsBad =
              self.showBadDataTypeOps_ && row['is_bad_data_type'] != 0;

            return showAsBad ? '<span class="badOp">' + data + '</span>' : data;
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
        },
      ],
    });

    initColumnFiltering(selector);

    if (showExportButtons) {
      prependExportLabel();
    }

    setupColumnFiltering(selector, datatable, [], self.booleanOpCols_);

    return datatable;
  },

  setAllOpsSelectionListener: function () {
    const self = this;
    $('#titleForKernelList').hide();

    $(self.dtOpsSelector_ + ' tbody')
      .unbind()
      .on('click', 'tr', function () {
        $(self.dtOpsSelector_ + ' tr').removeClass('row_selected');
        $(this).addClass('row_selected');

        var data = self.allOpsDataTable.row(this).data();

        $('#titleForKernelList').show();
        $('#titleForKernelList').html(
          'Here is the kernel summary for op <strong>' +
            data['op_node_name'] +
            '</strong>'
        );

        if (data != null) {
          self.opID_ = data['op_node_id'];
          self.initKernelSummaryTable();
        }
      });
  },

  showAllOps: function () {
    this.showOnlyBadOpsButtonToggle_ = false;
    this.updateButtonStates();
    this.allOpsDataTable.draw();
  },

  showBadOps: function () {
    this.showOnlyBadOpsButtonToggle_ = true;
    this.updateButtonStates();
    this.allOpsDataTable.draw();
  },

  updateButtonStates: function () {
    if (this.showOnlyBadOpsButtonToggle_ == true) {
      $('#showAllOpsButton').show();
      $('#showBadOpsButton').hide();
    } else {
      $('#showAllOpsButton').hide();
      $('#showBadOpsButton').show();
    }
  },

  initKernelSummaryTable: function () {
    const self = this;

    if (this.kernelSummaryDataTable == null) {
      this.kernelSummaryDataTable = $(this.dtKernelSelector_).DataTable({
        destroy: true,
        bProcessing: true,
        bServerSide: true,
        bjQueryUI: true,
        sAjaxSource: 'dlprof/datatable/kernel_summaries_datatable',
        sAjaxDataProp: 'kernelSummariesProp',
        fnServerParams: function (aoData) {
          aoData.push({name: 'aggregation', value: self.aggrID_});
          aoData.push({name: 'domain', value: self.domainName_});
          aoData.push({name: 'opID', value: self.opID_});
        },
        dom: getDatatablesDom(),
        columns: [
          {data: 'kernel_name'},
          {data: 'uses_tc'},
          {data: 'calls'},
          {data: 'gpu_time'},
          {data: 'avg'},
          {data: 'min'},
          {data: 'max'},
        ],
        buttons: getDatatableButtons(
          Globals.getProfileName() + ' Kernels in Op',
          'landscape'
        ),
        orderCellsTop: true,
        fixedHeader: true,
        select: true,
        autoWidth: false,
        language: {
          emptyTable: 'Click an op in the table above',
        },
        order: [this.TABLE_KERNEL_SUMMARY_GPU_TIME, 'desc'], // pre-sort
        aoColumnDefs: [
          {
            aTargets: [
              this.TABLE_KERNEL_SUMMARY_GPU_TIME,
              this.TABLE_KERNEL_SUMMARY_AVG,
              this.TABLE_KERNEL_SUMMARY_MIN,
              this.TABLE_KERNEL_SUMMARY_MAX,
            ],
            sClass: 'dt-body-right dt-head-center',
            render: function (data, type, row, meta) {
              return (
                '<span class="cudaNoWrap">' +
                getRenderableNumber(data) +
                '</span>'
              );
            },
          },
          {
            aTargets: [this.TABLE_KERNEL_SUMMARY_USING_TC],
            render: function (data, type, row, meta) {
              if (type == 'export') {
                return data == 1 ? 'true' : 'false';
              } else {
                return data == 1 ? Globals.faCheck : Globals.faTimes;
              }
            },
          },
          {
            aTargets: [
              this.TABLE_KERNEL_SUMMARY_USING_TC,
              this.TABLE_KERNEL_SUMMARY_CALLS,
            ],
            sClass: 'dt-center',
          },
          {
            aTargets: ['sortDescFirst'],
            asSorting: ['desc', 'asc'],
          },
        ],
      });

      initColumnFiltering(this.dtKernelSelector_);
      prependExportLabel();
      setupColumnFiltering(
        this.dtKernelSelector_,
        this.kernelSummaryDataTable,
        [],
        this.booleanKernelCols_
      );
    } else {
      this.kernelSummaryDataTable.draw();
    }
  },
};
