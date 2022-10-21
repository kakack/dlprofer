/* !@file IterationsView.js
 *
 * Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function IterationsView() {
  document.title = 'DLProf: Iterations';

  this.chart_ = new IterationsChart();
  this.newStart_ = Globals.getIterStart();
  this.newStop_ = Globals.getIterStop();
}

IterationsView.prototype = {
  constructor: IterationsView,

  initViewIterations: function (aggrID, domainName) {
    const self = this;
    var iterationsViewDurationsOpen = {val: true};

    self.newKeyOpName_ = Globals.getKeyOpName();
    self.setIterBadges();
    self.setupOpPicker(aggrID, domainName);
    self.setAggregateButton();
    self.setIterationButtonListeners();
    self.setKeyOpName();

    function callback() {
      problem = getStorage(Globals.EXP_SYS_PROBLEM_KEY);
      recommendation = getStorage(Globals.EXP_SYS_RECOMMENDATION_KEY);
      escapedArgs = getStorage(Globals.EXP_SYS_ARGS_KEY);

      if (escapedArgs.length > 0) {
        args = replaceAll(escapedArgs, '^', '"');
        const obj = JSON.parse(args);

        self.newStart_ = obj['ideal_start'];
        self.newStop_ = obj['ideal_stop'];
      }

      self.initSpinners();

      const allIterationCount = self.chart_.staticIterations_.length;
      const profiledIterationCount = self.chart_.profiledIterations_.length;
      const showButtons = allIterationCount != profiledIterationCount;

      if (!showButtons) {
        $('#allIterations').hide();
        $('#profiledIterations').hide();
      }

      if (problem.length > 0 || recommendation.length > 0) {
        $('#iterationProblem').html(problem);
        $('#iterationRecommendation').html(recommendation);

        $('#iterationProblemDiv').show();
      } else {
        $('#iterationProblemDiv').hide();
      }

      // Reset selected button in DOM
      //
      $('.iterationDurationButton').removeClass('btn-primary'); // remove from all buttons
      $('.iterationDurationButton').removeClass('active'); // remove from all buttons
      $('#allIterations').addClass('btn-primary'); // add to one button

      // Reset the radio button selections
      //
      $('input[name=iterationRangeSelectionName]').prop('checked', true);
      $('#allIterations').click();
    }

    self.chart_.initChart(
      '#iterationsViewDurationsChart',
      aggrID,
      domainName,
      callback
    );
  },

  // Abstract/PureVirtual function must be implemented by all
  // droplist selection listeners
  //
  droplistListener: function (e, aggrID, domainName) {
    const self = this;
    self.initViewIterations(aggrID, domainName);
  },

  setupOpPicker: function (aggrID, domainName) {
    const self = this;
    $('#selectNodeButton')
      .unbind()
      .click(function () {
        self.showOps(aggrID, domainName);
      });
  },

  setKeyOpName: function () {
    $('#selectNodeLabel').val(this.newKeyOpName_);
    $('#selectNodeLabel').attr('title', this.newKeyOpName_);
  },

  isDuplicate: function () {
    const self = this;

    for (var ii = 0; ii < AggregationDroplist.aggregations_.length; ii++) {
      const aggr = AggregationDroplist.aggregations_[ii];
      const matchIterStart = aggr.iter_start == self.newStart_;
      const matchIterStop = aggr.iter_stop == self.newStop_;
      const matchKeyOp = aggr.key_node_name == self.newKeyOpName_;

      if (matchIterStart && matchIterStop && matchKeyOp) {
        return true;
      }
    }
    return false;
  },

  setAggregateButton: function () {
    const self = this;

    // Setup reaggregate button message handler
    //
    $('#reaggregateButton')
      .unbind()
      .click(function () {
        if (self.isDuplicate()) {
          BootstrapDialog.show({
            type: BootstrapDialog.TYPE_DANGER,
            title: 'Duplicate Aggregation',
            message:
              'Cannot create duplicate aggregation.<br/><br/>Change iteration start, or iteration stop, or key node, and try again.',
          });
        } else {
          self.launchConfirmationDialog();
        }
      });
  },

  launchConfirmationDialog: function () {
    const self = this;
    const prompt =
      'Would you like to reaggregate your network from iteration ' +
      self.newStart_ +
      ' to ' +
      self.newStop_ +
      '?';

    // Show confirmation dlg: "Add you sure?"
    //
    BootstrapDialog.confirm({
      title: 'Reaggregate',
      message: prompt,
      type: BootstrapDialog.TYPE_SUCCESS,
      callback: function (result) {
        if (result) {
          $('#reaggregate-setup-panel').hide();

          $('#reaggregate-inprogress-panel').show();
          self.reaggregate();
        }
      },
    });
  },

  setIterBadges: function () {
    $('#iterTotal').text(Globals.getIterTotal());
    $('#iterProfiled').text(Globals.getIterProfiled());
    $('#iterStart').text(Globals.getIterStart());
    $('#iterStop').text(Globals.getIterStop());
  },

  setIterationButtonListeners: function () {
    // Duration message handlers
    //
    const self = this;
    $('input[name=iterationRangeSelectionName]:radio')
      .unbind()
      .change(function (e) {
        $('.iterationDurationButton').removeClass('btn-primary');
        const setting = $(
          'input[name=iterationRangeSelectionName]:checked'
        ).val();
        const selector = '#' + setting;
        $(selector).addClass('btn-primary');

        self.chart_.showAllIterations_ = setting === 'allIterations';
        self.chart_.fillChart();

        self.chart_.showStartStop(self.newStart_, self.newStop_);
      });
  },

  initSpinners: function () {
    this.connectSpinners(
      $('#newIterStart'),
      $('#newIterStop'),
      Globals.getIterTotal() == 0 ? 0 : Globals.getIterTotal() - 1
    );
    $('#newIterStart').spinner('value', this.newStart_);
    $('#newIterStop').spinner('value', this.newStop_);
  },

  connectSpinners: function (startSpinner, stopSpinner, max) {
    const self = this;

    if (startSpinner.spinner('instance')) {
      startSpinner.spinner('destroy');
    }

    startSpinner.spinner({
      min: 0,
      max: max,
      spin: function (event, ui) {
        if (ui.value > stopSpinner.val()) {
          return false;
        }
        self.newStart_ = ui.value;
        self.spinnerHasSpun(
          startSpinner,
          ui.value,
          ui.value,
          stopSpinner.val()
        );
      },
      change: function (event, ui) {
        const newStart = Number(startSpinner.val());
        if (newStart > stopSpinner.val()) {
          startSpinner.val(self.newStart_); // reset
          return false;
        }
        self.newStart_ = newStart;
        self.spinnerHasSpun(
          startSpinner,
          newStart,
          newStart,
          stopSpinner.val()
        );
      },
    });

    if (stopSpinner.spinner('instance')) {
      stopSpinner.spinner('destroy');
    }

    stopSpinner.spinner({
      min: 0,
      max: max,
      spin: function (event, ui) {
        if (ui.value < startSpinner.val()) {
          return false;
        }
        self.newStop_ = ui.value;
        self.spinnerHasSpun(
          stopSpinner,
          ui.value,
          startSpinner.val(),
          ui.value
        );
      },
      change: function (event, ui) {
        const newStop = Number(stopSpinner.val());
        if (newStop < startSpinner.val()) {
          stopSpinner.val(self.newStop_); // reset
          return false;
        }

        self.newStop_ = newStop;
        self.spinnerHasSpun(stopSpinner, newStop, startSpinner.val(), newStop);
      },
    });
  },

  spinnerHasSpun: function (spinner, newVal, newStart, newStop) {
    spinner.val(newVal);
    spinner.change();
    this.chart_.showStartStop(newStart, newStop);
  },

  showOps: function (aggrID, domainName) {
    const self = this;

    // Any changes to the HTML in this dialog should be reflected in OpsAndKernelsPanel.html
    //
    var $content = '      <table id="dlgDatatableAllOps"';
    $content +=
      'class="table table-condensed table-striped table-bordered dlProfDataTable"';
    $content += '      >';
    $content += '        <thead>';
    $content += '          <tr>';
    $content += '            <th style="display:none">GPU Time (ns)</th>';
    $content += '            <th style="display:none">CPU Time (ns)</th>';
    $content += '            <th>Op ID</th>';
    $content += '            <th>Op Name</th>';
    $content += '            <th>Direction</th>';
    $content += '            <th class="cudaNoWrap">Op Type</th>';
    $content += '            <th class="sortDescFirst">Calls</th>';
    $content += '            <th class="sortDescFirst">TC Eligible</th>';
    $content += '            <th class="sortDescFirst">Using TC</th>';
    $content += '            <th class="sortDescFirst">Kernel Calls</th>';
    $content += '            <th style="display:none">Data Type</th>';
    $content += '            <th style="display:none">Stack Trace</th>';
    $content += '          </tr>';
    $content += '        </thead>';
    $content += '      </table>';

    var dataTable;

    function setDlgAllOpsSelectionListener() {
      $('#dlgDatatableAllOps tbody')
        .unbind()
        .on('click', 'tr', function () {
          $('#dlgDatatableAllOps tr').removeClass('row_selected');
          $(this).addClass('row_selected');

          var data = dataTable.row(this).data();

          if (data != null) {
            self.newKeyOpName_ = data['op_node_name'];
          }
        });
    }

    BootstrapDialog.show({
      title: 'Select a Key Node',
      message: $content,
      size: BootstrapDialog.SIZE_WIDE,
      type: BootstrapDialog.TYPE_SUCCESS,
      onshown: function (dialogRef) {
        const opsPanel = new OpsAndKernelsPanel();
        dataTable = opsPanel.createOpsDataTable(
          '#dlgDatatableAllOps',
          aggrID,
          domainName,
          false
        );

        dataTable.column(opsPanel.COL_GPU_TIME).visible(false);
        dataTable.column(opsPanel.COL_CPU_TIME).visible(false);
        dataTable.column(opsPanel.COL_DATA_TYPE).visible(false);
        dataTable.column(opsPanel.COL_STACK_TRACE).visible(false);

        dataTable.order([opsPanel.COL_OP_NAME, 'asc']).draw();

        setDlgAllOpsSelectionListener();
      },
      buttons: [
        {
          label: ' OK ',
          action: function (dialogRef) {
            $('#selectNodeLabel').val(self.newKeyOpName_);
            $('#selectNodeLabel').attr('title', self.newKeyOpName_);
            dialogRef.close();
          },
        },
        {
          label: 'Cancel',
          action: function (dialogRef) {
            dialogRef.close();
          },
        },
      ],
    });
  },

  reaggregate: function () {
    const self = this;

    console.info('Aggregate request is being sent to server.');

    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === name + '=') {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // Call the flask endpoint
    //
    $.ajax({
      type: 'POST',
      url: 'dlprof/command/aggregate_cmd',
      async: true,
      data: {
        newIterStart: self.newStart_,
        newIterStop: self.newStop_,
        newKeyOpName: self.newKeyOpName_,
      },
      headers: {
        'X-CSRFToken': csrftoken,
      },
      success: function (jqXHR, textStatus, errorThrown) {
        $('#reaggregate-inprogress-panel').hide();

        $('#reaggregate-setup-panel').show();

        const STATUS = 0;
        const RETURN_CODE = 1;
        const INTERNAL_SERVER_ERROR = 500;

        if (jqXHR[RETURN_CODE] == INTERNAL_SERVER_ERROR) {
          const str = jqXHR[STATUS];
          const json = JSON.parse(str);
          const value = json['status'];
          jqXHR.responseText = value;

          showErrorString(jqXHR, textStatus, errorThrown);
        } else {
          console.info(
            'Aggregate response has successfully been received from the server.'
          );

          $('#reaggregate-finished-panel').show();

          var str = window.location.search;
          str = replaceQueryParam(Globals.SELECTED_AGGREGATION_URL, '', str);
          history.replaceState({}, '', window.location.pathname + str);

          localStorage.removeItem(Globals.SELECTED_AGGREGATION_KEY);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        $('#reaggregate-inprogress-panel').hide();

        if (jqXHR.status == 500) {
          const map = JSON.parse(jqXHR.responseJSON);
          const errStr = map['status'];
          jqXHR.responseText = errStr;
        }

        showErrorString(jqXHR, textStatus, errorThrown);
      },
    });
  },
};
