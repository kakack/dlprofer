/* !@file DLprofFunctions.js
 *
 * Copyright (c) 2019-2021, NVIDIA CORPORATION.  All rights reserved.
 *
 * NVIDIA CORPORATION and its licensors retain all intellectual property
 * and proprietary rights in and to this software, related documentation
 * and any modifications thereto.  Any use, reproduction, disclosure or
 * distribution of this software and related documentation without an express
 * license agreement from NVIDIA CORPORATION is strictly prohibited.
 */

function toNumber(strFromProtobuf) {
  return parseInt(strFromProtobuf, 10);
}

function numberToDecimal(duration, decimalPlaces = 0) {
  var returnvalue = Number(0);

  if (
    duration != undefined &&
    duration != Infinity &&
    !isNaN(duration) &&
    duration < Number.MAX_SAFE_INTEGER
  ) {
    const newNumber = Number(duration);
    returnvalue = newNumber.toFixed(decimalPlaces);
  }

  return returnvalue;
}

function numberToThousandsSeparator(number) {
  number = number == null ? 0 : number;
  return parseFloat(number).toLocaleString('en');
}

function getRenderableNumber(strValueFromProtobuf, decimalPlaces = 0) {
  var returnvalue = 0;

  if (strValueFromProtobuf != null) {
    var intValueFromProtobuf = toNumber(strValueFromProtobuf, 10);
    var valueWithDecimal = numberToDecimal(intValueFromProtobuf, decimalPlaces);
    returnvalue = numberToThousandsSeparator(valueWithDecimal);
  }

  return returnvalue;
}

// Converts nanosecond strings from protobuf into microsecond values
// And puts the value into the DOM.
//
function renderDuration(selector, strValueFromProtobuf) {
  var renderableDuration = 0;

  if (strValueFromProtobuf != null) {
    renderableDuration = getRenderableNumber(strValueFromProtobuf);
  }

  $(selector).text(renderableDuration);
}

function renderNumber(selector, strValueFromProtobuf, decimalPlaces = 0) {
  var renderableNumber = 0;

  if (strValueFromProtobuf != null) {
    renderableNumber = getRenderableNumber(strValueFromProtobuf, decimalPlaces);
  }

  $(selector).text(renderableNumber);
}

var DLTimeUnits = [
  {symbol: 'ns', numUnits: 1},
  {symbol: 'µs', numUnits: 1000},
  {symbol: 'ms', numUnits: 1000},
  {symbol: 's', numUnits: 1000},
  {symbol: 'min', numUnits: 60},
  {symbol: 'hr', numUnits: 60},
  {symbol: 'days', numUnits: 24},
];

function convertUnitsToHumanReadable(value, unitIndex = 0) {
  if (
    unitIndex + 1 < DLTimeUnits.length &&
    value >= DLTimeUnits[unitIndex + 1].numUnits
  ) {
    return convertUnitsToHumanReadable(
      value / DLTimeUnits[unitIndex + 1].numUnits,
      unitIndex + 1
    );
  }

  return {
    value: Number(value).toPrecision(3),
    units: DLTimeUnits[unitIndex].symbol,
    unitIndex: unitIndex,
  };
}

// Synchronous load
//
function loadHtml(selector, file) {
  const data = $.ajax({
    type: 'GET',
    url: file,
    async: false,
  }).responseText;

  $(selector).html(data);
}

function getProgressCell(numerator, denominator) {
  const percentage = numberToDecimal(
    100.0 * (numerator / denominator),
    Globals.MANTISSA_LENGTH
  );

  // Initialize numerator here.  Override later to exponential if needed.
  //
  var visibleNumerator = numberToThousandsSeparator(
    numberToDecimal(numerator, Globals.MANTISSA_LENGTH)
  );

  // Example: 0.000001 to 3 decimal places is 0.000
  //
  var roundedToZero = '0.';
  for (var ii = 0; ii < Globals.MANTISSA_LENGTH; ii++) {
    roundedToZero += '0';
  }

  if (numberToDecimal(numerator, Globals.MANTISSA_LENGTH) === roundedToZero) {
    // Convert to exponential only if there is an actual value in numerator
    //
    if (numerator !== 0) {
      visibleNumerator = numerator.toExponential(Globals.MANTISSA_LENGTH);
    }
  }

  // prettier-ignore
  const tooltip =
    '' +
    visibleNumerator +
    ' / ' +
    numberToThousandsSeparator(denominator) +
    ' = ' +
    percentage +
    ' %';

  // prettier-ignore
  const progress = ''
    + '<progress class="dlprofProgressBar" value="'
    + numerator
    + '" max="'
    + denominator
    + '">'
    + '</progress>';

  // prettier-ignore
  const divNumber =
    '' + '<div class="dlprofProgressDuration">' + visibleNumerator + '</div>';

  const divProgress = '<div class="dlprofProgressBar">' + progress + '</div>';

  // prettier-ignore
  const divPercent = ''
    + '<div class="dlprofProgressDuration">'
    + percentage
    + ' %</div>';

  // prettier-ignore
  const table = ''
    + '<div class="dlprofProgressParent" title="' + tooltip + '">'
    + divNumber
    + divProgress
    + divPercent
    + '</div>';

  return table;
}

function isNonEmptyString(possibleString) {
  return typeof possibleString === 'string' && possibleString.length > 0;
}

// Reusable function to format the various UI elements surrounding a DataTable
//
function getDatatablesDom() {
  // DOM help
  // https://datatables.net/reference/option/dom
  //

  // prettier-ignore
  return (
    '' +
    "<'row'" +
    "<'col-sm-4 dlprofDomSize'l>" +                                     // top-left-row
    "<'col-sm-4 dlprofDomSize alignLeft dlprofDatatableButtons'B>" +    // top-center-row
    "<'col-sm-4 dlprofDomSize'f>>" +                                    // top-right-row
    "<'row'" +
    "<'col-sm-12'tr>>" +                                                // the table itself
    "<'row'" +
    "<'col-sm-5 dlprofDomSize'i>" +                                     // bottom-left-row
    "<'col-sm-7 dlprofDomSize'p>>"                                      // bottom-right-row
  );
}

function defaultExportAction(self, e, dt, node, config) {
  if (node[0].className.indexOf('buttons-excel') >= 0) {
    $.fn.dataTable.ext.buttons.excelHtml5.action.call(
      self,
      e,
      dt,
      node,
      config
    );
  } else if (node[0].className.indexOf('buttons-pdf') >= 0) {
    $.fn.dataTable.ext.buttons.pdfHtml5.action.call(self, e, dt, node, config);
  } else if (node[0].className.indexOf('buttons-copy') >= 0) {
    $.fn.dataTable.ext.buttons.copyHtml5.action.call(self, e, dt, node, config);
  } else if (node[0].className.indexOf('buttons-csv') >= 0) {
    $.fn.dataTable.ext.buttons.csvHtml5.action.call(self, e, dt, node, config);
  } else if (node[0].className.indexOf('buttons-json') >= 0) {
    let data = dt.buttons.exportData();
    $.fn.dataTable.fileSave(
      new Blob([JSON.stringify(data)]),
      config.title + '.json'
    );
  }
}

function exportAllAction(e, dt, node, config) {
  // Save previous starting index so that table won't update when fetching all
  // data for export purposes
  let oldStart = dt.settings()[0]._iDisplayStart;
  const self = this;

  // Datatables can only export what is available to the client. We can send
  // all of the data to the client without displaying it in the DOM for the
  // purpose of exporting it.
  dt.one('preXhr', function (e, settings, json) {
    json.iDisplayStart = 0;
    json.iDisplayLength = 2147483647;

    // Perform default export operation on all table data brought to client
    dt.one('preDraw', function (e, settings) {
      defaultExportAction(self, e, dt, node, config);

      // Reset start index to what it was before querying all table data so
      // table doesn't begin displaying at default index 0
      dt.one('preXhr', function (e, settings, json) {
        settings._iDisplayStart = oldStart;
        json.iDisplayStart = oldStart;
      });

      // Reload contents of table with what was originally being displayed
      setTimeout(dt.ajax.reload, 0);

      // Do not display all table data
      return false;
    });
  });

  // Reload so that all data can be fetched and exported
  dt.ajax.reload();
}

// Reusable function to add export buttons to all DataTables consistently
//
function getDatatableButtons(
  reportName,
  orientation = 'portrait',
  hasWideColumn = false
) {
  return [
    // Button extentions
    // https://datatables.net/extensions/buttons/examples/html5/index.html
    //
    {
      extend: 'excelHtml5',
      action: exportAllAction,
      title: reportName,
      exportOptions: {orthogonal: 'export', columns: ':visible'},
    },
    {
      extend: 'pdfHtml5',
      action: exportAllAction,
      title: reportName,
      orientation: orientation,
      download: 'open',
      messageTop: 'PDF created by DLProf Viewer.',
      pageSize: hasWideColumn ? 'A1' : 'A4',
      exportOptions: {orthogonal: 'export', columns: ':visible'},
    },
    {
      extend: 'copyHtml5',
      action: exportAllAction,
      title: reportName,
      text: 'Clipboard',
      exportOptions: {orthogonal: 'export', columns: ':visible'},
    },
    {
      extend: 'csvHtml5',
      action: exportAllAction,
      title: reportName,
      exportOptions: {orthogonal: 'export', columns: ':visible'},
    },
    {
      text: 'JSON',
      className: 'buttons-json',
      action: exportAllAction,
      title: reportName,
      exportOptions: {orthogonal: 'export', columns: ':visible'},
    },
  ];
}

function prependExportLabel() {
  const exportText = 'Export to: ';

  $('.dlprofDatatableButtons').each(function () {
    const label = $(this).text();
    if (label.includes(exportText) != true) {
      $(this).prepend(
        '<span style="float: left; padding-top: 0.255em; padding-right: 0.255em;">' +
          exportText +
          '</span>'
      );
    }
  });
}

function initColumnFiltering(selector) {
  // Init - add a second header row to be used by text boxes
  //
  $(selector + ' thead tr')
    .clone()
    .appendTo(selector + ' thead');
}

function setupColumnFiltering(
  selector,
  datatable,
  searchableColumns = [],
  booleanColumns = []
) {
  // Setup - Iterate over each column header in new 2nd header row
  //
  datatable.columns().every(function () {
    if (this.visible() === false) {
      return;
    }

    let colIdx = this.index();
    let filterHeader = $(this.header())
      .parent()
      .next()
      .children()
      .eq($(this.header()).index());

    // Setup searching on columns being passed-in
    // ....or all columns if searchColumns array is empty
    //
    if (
      searchableColumns.length == 0 ||
      searchableColumns.indexOf(colIdx) >= 0
    ) {
      // Add a little help text inside the text box
      //
      const title = $(this.header()).text();
      var placeHolderText = 'Search ' + title;

      if (booleanColumns.length > 0 && booleanColumns.indexOf(colIdx) >= 0) {
        placeHolderText = '0 or 1';
      }

      $(filterHeader).html(
        '<input type="text" placeholder="' + placeHolderText + '" />'
      );

      // Setup keypress event handler
      //
      $('input', filterHeader).on('keyup change', function () {
        const dtCol = datatable.column(colIdx);

        // Use datatables search API, which effectively shows the
        // rows that match the user's text input
        //
        if (dtCol.search() !== this.value) {
          dtCol.search(this.value, false, false).draw();
        }
      });

      // Remove the Up/Down sorting arrows from the TH in 2nd row
      //
      const parent = $('input', filterHeader).parent().removeClass('sorting');
    } else {
      // Clear cloned TH label in case column is not searchable
      //
      $(filterHeader).html('');
    }
  });
}

function addSeeMoreLessToCell(cell, maxLength = 100) {
  if ($(cell).is(':empty')) {
    return;
  }
  if ($(cell).text().length < maxLength && !$(cell).html().includes('<br>')) {
    return;
  }
  $(cell).contents().wrapAll('<div class="content"></div>');
  let content = $(cell).find('.content');
  content.data('html', content.html());
  content.data('isSeeingMore', false);
  let endIdx = maxLength;
  let indexOfFirstBreak = content.html().indexOf('<br>');

  if (indexOfFirstBreak != -1 && indexOfFirstBreak < endIdx) {
    endIdx = indexOfFirstBreak;
  }

  content.html(content.html().substring(0, endIdx));
  $(cell).append(
    '<a class="see-more-less">See more <i class="fa fa-chevron-down" aria-hidden="true"></i></a>'
  );
  let seeMoreLessButton = $(cell).find('.see-more-less');
  seeMoreLessButton.css('cursor', 'pointer');
  seeMoreLessButton.click(function () {
    if (content.data('isSeeingMore')) {
      content.html(content.html().substring(0, endIdx));
      seeMoreLessButton.html(
        'See more <i class="fa fa-chevron-down" aria-hidden="true"></i>'
      );
    } else {
      content.html(content.data('html'));
      seeMoreLessButton.html(
        'See less <i class="fa fa-chevron-up" aria-hidden="true"></i>'
      );
    }
    content.data('isSeeingMore', !content.data('isSeeingMore'));
  });
}

function showErrorString(jqXHR, textStatus, errorThrown) {
  console.error('DLProf Detected error: ', jqXHR, textStatus, errorThrown);

  // Injection: If database is not found, then display panel instead of message box.
  //
  if (typeof jqXHR.responseJSON !== null) {
    const json = jqXHR.responseJSON;

    if (json != null && json.hasOwnProperty('db_not_found_error')) {
      const db_not_found_error = json['db_not_found_error'];

      if (db_not_found_error) {
        showDatabaseNotFoundError(json['filename']);
        return;
      }
    }
  }

  BootstrapDialog.show({
    type: BootstrapDialog.TYPE_DANGER,
    title: 'Error',
    message: jqXHR.responseText,
  });
}

function showDatabaseNotFoundError(dbFileName) {
  $('#dbFileName').text(dbFileName);
  $('#database-file-not-found-exception').show();
  $('#dlprof-wrapper').hide();
}

function showDatabaseVersionNotFoundError() {
  $('#database-version-not-found-exception').show();
  $('#dlprof-wrapper').hide();
}

function showDatabaseTooNewError() {
  $('#database-version-too-new-exception').show();
  $('#dlprof-wrapper').hide();
}

function getLongestDuration(aggrID, domainName) {
  return $.ajax({
    type: 'GET',
    url: 'dlprof/rest/longest_iter_duration_data',
    async: true,
    data: {aggregation: aggrID, domain: domainName},
    success: function (jqXHR, textStatus, errorThrown) {
      duration = jqXHR['duration'];
    },
    error: function (jqXHR, textStatus, errorThrown) {
      showErrorString(jqXHR, textStatus, errorThrown);
    },
  });
}

function getLongestDurationSynchronous(aggrID, domainName) {
  var iter_value, duration;

  $.ajax({
    type: 'GET',
    url: 'dlprof/rest/longest_iter_duration_data',
    async: false,
    data: {aggregation: aggrID, domain: domainName},
    success: function (jqXHR, textStatus, errorThrown) {
      iter_value = jqXHR['iter_value'];
      duration = jqXHR['duration'];
    },
    error: function (jqXHR, textStatus, errorThrown) {
      showErrorString(jqXHR, textStatus, errorThrown);
    },
  });

  return {iter_value, duration};
}

// Number used to divide into existing values to account for unit
//
function getDivisor(duration) {
  const idx = convertUnitsToHumanReadable(duration).unitIndex;

  divisor = 1;

  for (var ii = 0; ii <= idx; ii++) {
    divisor = divisor * DLTimeUnits[ii].numUnits;
  }

  return divisor;
}

function getUnits(duration) {
  return convertUnitsToHumanReadable(duration).units;
}

// Function to replace value of a key/value pair in a URL
//  param: The key name inside the URL
//  newval: The new value of the key
//  search: Any URL.
//    DLProf uses window.location.search
//    See https://webplatform.github.io/docs/apis/location/search/
//
// Example:
//  Call:         replaceQueryParam('aggrID', 5, '?aggrID=2&domainName=Gradient')
//  Return value: '?domainName=Gradient&aggrID=5'
//
function replaceQueryParam(param, newval, search) {
  var regex = new RegExp('([?;&])' + param + '[^&;]*[;&]?');
  var query = search.replace(regex, '$1').replace(/&$/, '');

  return (
    (query.length > 2 ? query + '&' : '?') +
    (newval ? param + '=' + newval : '')
  );
}

function getStorage(key) {
  value = '';

  storage = localStorage.getItem(key);
  if (storage != null && storage.length > 0) {
    value = storage;
    localStorage.removeItem(key);
  }

  return value;
}

function strncmp(a, b, n) {
  return a.substr(0, n) == b.substr(0, n);
}

function replaceAll(string, search, replace) {
  return string.split(search).join(replace);
}
