let $start_with_open_accordions = false;
let tblHeader = {
  'ON': 'Portfolio Name',
  'PNL': 'PNL',
  'MMP': 'Max Profit/Loss and Time',
  // 'MaxMinPNLTime'		: 'Profit/Loss Time',
  'CPP': 'CE PE PNL',
  'UGU': 'Underlying Gap Up/Down',
  'UC': 'Underlying Changes',
  'LD': 'Leg Detalils' //Array will be split into columns
};
let summary_table_header = ['Overall Profit and Loss',
  'Avg Day PNL',
  'Max Profit', 'Max Loss', 'Total Days', 'Win% (Days)',
  'Loss% (Days)', 'Max Winning Streak', 'Max Losing Streak',
  'Avg Profit On Win Days', 'Avg Loss On Loss Days', 'Reward To Risk Ratio',
  'Expectancy', 'Max Drawdown (Days)'
]
$(function() {
  $('.datePicker').datepicker({
    format: 'dd-M-yyyy',
    autoclose: true,
  });
});


$("#startDate").val($_json[0].RD); //set default stating date
$("#endDate").val($_json[$_json.length - 1].RD); //set default stating date

let monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
let dayArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];



function btnActionExpandCollapse(e) {
  if ($(e).data('state')) {
    $(e).data('state', 0);
    $('.collapse').each(function(i, e) {
      console.log($(e).attr('id'));
      if ($(e).attr('id') != "collapse_portfolio_table" && $(e).attr('id') != "collapse_strategy_table") { //So that button doesn't affect strategy and portfolio table
        setTimeout(function() {
          $(e).collapse('hide')
        }, 5)
      }

    });
    $(e).text('Expand all days');
  } else {
    $(e).data('state', 1);
    $('.collapse').each(function(i, e) {
      if ($(e).attr('id') != "collapse_portfolio_table" && $(e).attr('id') != "collapse_strategy_table") { //So that button doesn't affect strategy and portfolio table
        setTimeout(function() {
          $(e).collapse('show')
        }, 5)
      }
    });
    $(e).text('Collapse all days');
  }
}

function addOptNameFilter() {
  $_json.optNames = $_json.optNames || []; //portfolio available in data
  for (d of $_json) {
    for (p of d.LR) {
      $_json.optNames.push(p.ON);
    }
  }

  let options = Array.from(new Set($_json.optNames));
  $("#filter_wr #optName").select2({
    data: options
  })
  $('#filter_wr #optName').select2('destroy').find('option').prop('selected', 'selected').end().select2();
}
addOptNameFilter();


function generateTable($data, $index) {
  if (!$data.active) {
    return '';
  }
  //console.log("table",$data,$data.active,$data.tmpInactive);
  // let [dataHTML, maxLeg] = generateTableRows($data.LR);
  // console.log('generating tbl',dataHTML,maxLeg)
  // console.log("data",$data)

  let $heading = `${$data.RD} (${$data.Day}), PNL: ${$data.DP.toFixed(2)}, Max PNL: ${$data.MP}(${$data.MPT}), Min PNL: ${$data.MNP}(${$data.MNPT}) `; //ResultDate + '(' + Day + ')' + ', PNL: ' + DP + ', Max PNL: ' + MaxPNL + ', Min PNL: ' + MinPNL

  //let color = $data.DP >= 0 ? '#28a745':'#dc3545';
  let color = $data.DP >= 0 ? '1' : '2';
  //style="background-image: linear-gradient(180deg, ${color}, ${color}80,  ${color}); color: #fff;"
  let html = `<div class="accordion-item data_table dt_day_${$data.Day} watermark watermark2 ` + ($data.tmpInactive ? 'disabled' : '') + `" onclick="loadRowData(${$index}, this)">
								<div class="accordion-header heading color${color}" >
									<div class="check">
										<input type="checkbox" ` + (!$data.tmpInactive ? 'checked' : '') + ` onclick="changeDataState(${$index},this)"/>
									</div>
									<div class="accordion-button title ${$start_with_open_accordions?'':'collapsed'}" data-bs-toggle="collapse" data-bs-target="#collapse_${$index}" aria-expanded="false" aria-controls="collapse_${$index}">
                                        ${$heading}
                                  </div>
								</div>
								<div class="_data accordion-collapse collapse ${$start_with_open_accordions?'show':''}" id="collapse_${$index}">
                                        </div></div>`;

  return $(html);
}



function generateTableRows(records) {
  let html = '';
  let maxLegLength = 0;
  for (let d of records) {
    maxLegLength = Math.max(maxLegLength, d.LD.length);
  }
  for (let d of records) {
    // console.log("row->",d);
    if (!d.active) {
      continue;
    }

    let PFName = d.ON.replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "");

    html += `<tr class="PF_${PFName}">`;
    for (let key in tblHeader) {
      // console.log('field->',key,d[key])

      if (key == "LD") {
        for (let i = 0; i < maxLegLength; i++) {
          html += `<td style="background: #fff;color: #212529">` + (d.LD[i]?.text ?? '-') + `</td>`;
        }
      } else if (key == "PNL") {
        let color = d['__pnl'] < 0 ? 'red' : 'green';
        html += `<td class="${color}">${d['__pnl'].toFixed(2)}</td>`;
      } else if (key == "UGU") {

        let color = d['UGU'][0] == '-' ? 'red' : 'green';
        html += `<td class="${color}">${d['UGU']}</td>`;
      } else {
        if (!d[key]) {
          html += '<td style="background: #fff;color: #212529">-</td>';
        } else {
          html += `<td style="background: ${d[key]['backColor']};color: ${d[key]['foreColor']}">${d[key]}</td>`;
        }
      }
    }
    html += `</tr>`;
  }
  //console.log(maxLegLength);
  return [html, maxLegLength];
}

function generateMonthlyBreakup() {
  $_json.MonthlyBreakup = {};
  for (d of $_json) {
    let dt = d.RD.split('-');
    $_json.MonthlyBreakup[dt[2]] = $_json.MonthlyBreakup[dt[2]] || {};
    if (!d.active || d.lstActive == false || d.tmpInactive === true) {
      continue;
    }
    $_json.MonthlyBreakup[dt[2]][dt[1]] = $_json.MonthlyBreakup[dt[2]][dt[1]] || 0;
    $_json.MonthlyBreakup[dt[2]][dt[1]] += d.DP;
  }
  let html = '<div class="heading">Monthly Breakup</div><table style="color: #520898;">';
  html += "<tr><th style='width: 12.5%;'>Year</img></th>"

  for (let i = 0; i < 12; i++) {
    html += `<th style='width: 6.12%;'>${monthArray[i]}</th>`;
  }
  html += "<th>Total</th></tr>";
  for (let y in $_json.MonthlyBreakup) {
    // console.log("year",y)
    let sum = 0;
    html += `<tr><th>${y}</th>`;

    for (let m of monthArray) {
      let v = $_json.MonthlyBreakup[y][m] ?? 0;
      sum += v;
      let color = v < 0 ? 'red fw-bold' : v > 0 ? 'green fw-bold' : '';

      let mdd = {
        value: '-'
      };
      if ($_json.DrawDown.monthly[y] && $_json.DrawDown.monthly[y][m]) {
        mdd = calculateMDD($_json.DrawDown.monthly[y][m]);
      }
      html += `<td class="${color}">${v.toFixed(2)}<br/><span style="color: #dc3545">(${mdd.value})</span></td>`;
    }

    let mddYIndex = [];
    for (let m in $_json.DrawDown.monthly[y]) {
      mddYIndex = Array.prototype.concat(mddYIndex, $_json.DrawDown.monthly[y][m])
    }
    let mddY = calculateMDD(mddYIndex);
    let color = sum < 0 ? 'red fw-bold' : sum > 0 ? 'green fw-bold' : '';
    html += `<td class="${color}">${sum.toFixed(2)}<br/><span style="color: #dc3545">(${mddY.value})</span></td>`;
    html += '</tr>';
  }

  html += '</table>';

  $("#data_monthly_breakup_wr").html(html);
}

function generateWeeklyBreakup() {
  $_json.WeeklyBreakup = {};
  for (d of $_json) {
    if (!d.active || d.lstActive === false || d.tmpInactive === true) {
      continue;
    }
    $_json.WeeklyBreakup[d.Day] = ($_json.WeeklyBreakup[d.Day] ?? 0) + d.DP;
  }
  let html = '<div class="heading">Weekly Breakup</div><table style="color: #520898;">';
  html += "<tr>";
  let tr = "<tr>";
  for (let i = 1; i < 6; i++) {
    html += `<th style='width: 14.28%%;'>${dayArray[i]}</th>`;
    let v = $_json.WeeklyBreakup[dayArray[i]] ?? 0;
    let mdd = {
      value: '-'
    };

    if ($_json.DrawDown.weekly[dayArray[i]] ?? false) {
      mdd = calculateMDD($_json.DrawDown.weekly[dayArray[i]]);
    }
    let color = v < 0 ? 'red fw-bold' : v > 0 ? 'green fw-bold' : '';
    tr += `<td class="${color}">${v.toFixed(2)}<br/><span style="color: #dc3545">(${mdd.value})</span></td>`;
  }
  tr += "</tr>";
  html += "</tr>";
  html += tr;
  html += '</table>';

  $("#data_weekly_breakup_wr").html(html);
}

function generateSummaryBreakup() {
  // console.log($_json.portfolio_data)
  // let html = `<div class="heading">Portfolio Wise Breakup (${Object.keys($_json.portfolio_data).length})</div><table style="color: #520898;">`

  let html = `<div class="accordion-item data_table watermark watermark2">
                <div class="accordion-header heading" >
                  <div class="accordion-button title ${$start_with_open_accordions?'':'collapsed'}" data-bs-toggle="collapse" data-bs-target="#collapse_portfolio_table" aria-expanded="false" aria-controls="collapse_portfolio_table">
                                        <div class="">Portfolio Wise Breakup (${Object.keys($_json.portfolio_data).length})</div>
                                  </div>
                </div>
                <div class="_data accordion-collapse collapse ${$start_with_open_accordions?'show':''}" id="collapse_portfolio_table">
                                        `;

  html += '<table><tr><th>Portfolio Name</th>'
  for (let header of summary_table_header) {
    html += `<th>${header}</th>`
  }
  html += '</tr>'
  for (let op in $_json.portfolio_data) {
    html += '<tr>'
    html += `<th>${op}</th>`
    const pnl = $_json.portfolio_data[op]["pnl"].reduce((partialSum, a) => partialSum + a["value"], 0).toFixed(2);
    const totalDays = $_json.portfolio_data[op]["pnl"].length

    const avg_expiry_profit = (pnl / totalDays).toFixed(2) == 'NaN' ? 0 : (pnl / totalDays).toFixed(2);
    // const max_profit = Math.max(...$_json.portfolio_data[op]["pnl"].map(a=>a.value),0).toFixed(2)
    const max_profit = $_json.portfolio_data[op]["pnl"].reduce((prev, current) => (prev.value > current.value) ? prev : current)
    const max_profit_text = max_profit.value >= 0 ? `<td class=green>${max_profit.value.toFixed(2)}<br/><small>${max_profit.time.day}-${max_profit.time.month}-${max_profit.time.year}</small></td>` : '<td>-</td>'
    // const min_profit = Math.min(...$_json.portfolio_data[op]["pnl"].map(a=>a.value),0).toFixed(2)
    const min_profit = $_json.portfolio_data[op]["pnl"].reduce((prev, current) => (prev.value < current.value) ? prev : current)
    const min_profit_text = min_profit.value < 0 ? `<td class=red>${min_profit.value.toFixed(2)}<br/><small>${min_profit.time.day}-${min_profit.time.month}-${min_profit.time.year}</small></td>` : '<td>-</td>'

    const windays = $_json.portfolio_data[op]["pnl"].reduce((c, a) => a.value >= 0 ? c + 1 : c, 0)
    const win_percentage = ((windays * 100 / totalDays).toFixed(2) == 'NaN' ? 0 : (windays * 100 / totalDays)).toFixed(2)
    const lossdays = $_json.portfolio_data[op]["pnl"].reduce((c, a) => a.value < 0 ? c + 1 : c, 0)
    const loss_percentage = ((lossdays * 100 / totalDays).toFixed(2) == 'NaN' ? 0 : (lossdays * 100 / totalDays)).toFixed(2)

    const win_streak = continous_positive_streak($_json.portfolio_data[op]["pnl"].map(a => a.value))
    const loss_streak = continous_negative_streak($_json.portfolio_data[op]["pnl"].map(a => a.value))

    const profit_on_windays = $_json.portfolio_data[op]["pnl"].reduce((c, a) => a.value >= 0 ? c + a.value : c, 0).toFixed(2)
    const loss_on_lossdays = $_json.portfolio_data[op]["pnl"].reduce((c, a) => a.value < 0 ? c + a.value : c, 0).toFixed(2)

    const avg_profit_on_windays = (profit_on_windays / windays).toFixed(2) == 'NaN' ? 0 : (profit_on_windays / windays).toFixed(2)
    const avg_loss_on_lossdays = (loss_on_lossdays / lossdays).toFixed(2) == 'NaN' ? 0 : (loss_on_lossdays / lossdays).toFixed(2)

    let r2r = Math.abs(parseFloat(avg_profit_on_windays)) / Math.abs(parseFloat(avg_loss_on_lossdays));
    r2r = (r2r).toFixed(2) == 'NaN' ? 0 : (r2r).toFixed(2)

    let exp = ((r2r * win_percentage) - loss_percentage) / 100;
    exp = exp.toFixed(2) == 'NaN' ? 0 : (exp).toFixed(2);

    let cumulative_for_mdd = generatePODrawDownData($_json.portfolio_data[op]["pnl"])

    html += `<td class="bold ${pnl>=0?'green':'red'}">${pnl}</td>`
    html += `<td class="bold ${avg_expiry_profit>=0?'green':'red'}">${avg_expiry_profit}</td>`
    // html += `<td>Average portfolio PNL not applicable</td>`
    html += max_profit_text
    html += min_profit_text
    // html += `<td class=red>${min_profit}</td>`
    html += `<td class=${totalDays>=0?'green':'red'}>${totalDays}</td>`
    html += `<td class=green>${win_percentage} (${windays})</td>`
    html += `<td class=red>${loss_percentage} (${lossdays})</td>`
    html += `<td class=green>${win_streak}</td>`
    html += `<td class=red>${loss_streak}</td>`
    html += `<td class=green>${avg_profit_on_windays}</td>`
    html += `<td class=red>${avg_loss_on_lossdays}</td>`
    html += `<td class="green">${r2r}</td>`
    html += `<td class="bold ${exp>=0?'green':'red'}">${exp}</td>`
    html += `<td class="red">${cumulative_for_mdd}</td>`
    html += '</tr>'
  }
  html += '</table>'


  $("#summary_breakup_wr").html(html);
}

function generateStrategyBreakup() {
  // console.log($_json.strategy_data)
  // let html = `<div class="heading">Strategy Wise Breakup (${Object.keys($_json.strategy_data).length})</div><table style="color: #520898;">`
  let html = `<div class="accordion-item data_table watermark watermark2">
                <div class="accordion-header heading" >
                  <div class="accordion-button title ${$start_with_open_accordions?'':'collapsed'}" data-bs-toggle="collapse" data-bs-target="#collapse_strategy_table" aria-expanded="false" aria-controls="collapse_strategy_table">
                                        <div class="">Strategy Wise Breakup (${Object.keys($_json.strategy_data).length})</div>
                                  </div>
                </div>
                <div class="_data accordion-collapse collapse ${$start_with_open_accordions?'show':''}" id="collapse_strategy_table">
                                        `;

  html += '<table><tr><th>Strategy Name</th>'
  html += '<th>Portfolios</th>'
  for (let header of summary_table_header) {
    html += `<th>${header}</th>`
  }
  html += '</tr>'
  for (let st in $_json.strategy_data) {
    html += '<tr>'
    html += `<th>${st}</th>`
    html += `<td>${$_json.strategy_data[st]["options"].join(",<br/>")}</td>`
    const pnl = $_json.strategy_data[st]["pnl"].reduce((partialSum, a) => partialSum + a["value"], 0).toFixed(2);
    const totalDays = $_json.strategy_data[st]["pnl"].length

    const avg_expiry_profit = (pnl / totalDays).toFixed(2) == 'NaN' ? 0 : (pnl / totalDays).toFixed(2);
    // const max_profit = Math.max(...$_json.portfolio_data[st]["pnl"].map(a=>a.value),0).toFixed(2)
    const max_profit = $_json.strategy_data[st]["pnl"].reduce((prev, current) => (prev.value > current.value) ? prev : current)
    const max_profit_text = max_profit.value >= 0 ? `<td class=green>${max_profit.value.toFixed(2)}<br/><small>${max_profit.time.day}-${max_profit.time.month}-${max_profit.time.year}</small></td>` : '<td>-</td>'

    // const min_profit = Math.min(...$_json.portfolio_data[st]["pnl"].map(a=>a.value),0).toFixed(2)
    const min_profit = $_json.strategy_data[st]["pnl"].reduce((prev, current) => (prev.value < current.value) ? prev : current)
    const min_profit_text = min_profit.value < 0 ? `<td class=red>${min_profit.value.toFixed(2)}<br/><small>${min_profit.time.day}-${min_profit.time.month}-${min_profit.time.year}</small></td>` : '<td>-</td>'

    const windays = $_json.strategy_data[st]["pnl"].reduce((c, a) => a.value >= 0 ? c + 1 : c, 0)
    const win_percentage = ((windays * 100 / totalDays).toFixed(2) == 'NaN' ? 0 : (windays * 100 / totalDays)).toFixed(2)
    const lossdays = $_json.strategy_data[st]["pnl"].reduce((c, a) => a.value < 0 ? c + 1 : c, 0)
    const loss_percentage = ((lossdays * 100 / totalDays).toFixed(2) == 'NaN' ? 0 : (lossdays * 100 / totalDays)).toFixed(2)

    const win_streak = continous_positive_streak($_json.strategy_data[st]["pnl"].map(a => a.value))
    const loss_streak = continous_negative_streak($_json.strategy_data[st]["pnl"].map(a => a.value))

    const profit_on_windays = $_json.strategy_data[st]["pnl"].reduce((c, a) => a.value >= 0 ? c + a.value : c, 0).toFixed(2)
    const loss_on_lossdays = $_json.strategy_data[st]["pnl"].reduce((c, a) => a.value < 0 ? c + a.value : c, 0).toFixed(2)

    const avg_profit_on_windays = (profit_on_windays / windays).toFixed(2) == 'NaN' ? 0 : (profit_on_windays / windays).toFixed(2)
    const avg_loss_on_lossdays = (loss_on_lossdays / lossdays).toFixed(2) == 'NaN' ? 0 : (loss_on_lossdays / lossdays).toFixed(2)

    let r2r = Math.abs(parseFloat(avg_profit_on_windays)) / Math.abs(parseFloat(avg_loss_on_lossdays));
    r2r = (r2r).toFixed(2) == 'NaN' ? 0 : (r2r).toFixed(2)

    let exp = ((r2r * win_percentage) - loss_percentage) / 100;
    exp = exp.toFixed(2) == 'NaN' ? 0 : (exp).toFixed(2);

    let cumulative_for_mdd = generatePODrawDownData($_json.strategy_data[st]["pnl"])

    html += `<td class="bold ${pnl>=0?'green':'red'}">${pnl}</td>`
    html += `<td class="bold ${avg_expiry_profit>=0?'green':'red'}">${avg_expiry_profit}</td>`
    // html += `<td>Average portfolio PNL not applicable</td>`
    // html += `<td class=green>${max_profit.value}<br/><small>${max_profit.time.day}-${max_profit.time.month}-${max_profit.time.year}</small></td>`
    // html += `<td class=red>${min_profit.value}<br/><small>${min_profit.time.day}-${min_profit.time.month}-${min_profit.time.year}</small></td>`
    // html += `<td class=red>${min_profit}</td>`
    html += max_profit_text
    html += min_profit_text
    html += `<td class=${totalDays>=0?'green':'red'}>${totalDays}</td>`
    html += `<td class=green>${win_percentage} (${windays})</td>`
    html += `<td class=red>${loss_percentage} (${lossdays})</td>`
    html += `<td class=green>${win_streak}</td>`
    html += `<td class=red>${loss_streak}</td>`
    html += `<td class=green>${avg_profit_on_windays}</td>`
    html += `<td class=red>${avg_loss_on_lossdays}</td>`
    html += `<td class="green">${r2r}</td>`
    html += `<td class="bold ${exp>=0?'green':'red'}">${exp}</td>`
    html += `<td class="red">${cumulative_for_mdd}</td>`
    html += '</tr>'
  }
  html += '</table>'


  $("#strategy_breakup_wr").html(html);
}

function continous_positive_streak(data) {
  let max = 0;
  let pcount = 0;
  for (d of data) {
    if (d >= 0) {
      pcount++;
    } else {
      max = Math.max(max, pcount);
      pcount = 0;
    }
  }
  return Math.max(max, pcount);
}

function continous_negative_streak(data) {
  let min = 0;
  let pcount = 0;
  for (d of data) {
    if (d < 0) {
      pcount++;
    } else {
      min = Math.max(min, pcount);
      pcount = 0;
    }
  }
  return Math.max(min, pcount);
}

function generateDayData() {
  let PF = $("#filter_wr #optName").val();
  $_json.graphPNL = [];
  $_json.portfolio_data = {};
  $_json.strategy_data = {};
  // console.log("BD",$_json.strategy_data)

  for (let d of $_json) {
    //console.log("gen data = [old] ->",d.Day,d.active)
    if (!d.hasOwnProperty('active')) {
      d.active = true;
    }
    //console.log("gen data = [old2] ->",d.Day,d.active)

    let DP = DP2 = MaxPNL = MinPNL = 0;
    let dayActiveFlag = false; //
    let dx, dyr, mn, dt, dy
    if (d.active && !d.tmpInactive) {
      dx = d.RD.split('-');
      yr = dx[2];
      mn = monthArray.indexOf(dx[1]) + 1;
      dt = dx[0];
      dy = dayArray[(new Date(d.RD)).getDay()];
    }
    let temp_strategy = {}
    // console.log("JD",$_json.strategy_data)
    for (let p of d.LR) {
      if (!PF.includes(p.ON)) {
        p.active = false;
        continue;
      }
      p.__pnl = 0;
      let Slp = parseFloat($('#Slippages').val() ? $('#Slippages').val() : 0) / 100;
      //Slp = parseFloat(Slp.toFixed(2))
      for (let l of p.LD) {
        let tEnt = 0,
          tExt = 0,
          PNL = 0;
        if (l.Tp == 1) {
          tEnt = l.Ent * (1 - Slp);
          tExt = l.Ext * (1 + Slp);
          PNL = ((tEnt - tExt) * l.Qt) - l.Brk;
        } else {
          tEnt = l.Ent * (1 + Slp);
          tExt = l.Ext * (1 - Slp);
          PNL = ((tExt - tEnt) * l.Qt) - l.Brk;
        }
        PNL = parseFloat(PNL.toFixed(2))
        // PNL = PNL - l.Brk??0;
        let result = tEnt - tExt;
        result = parseFloat(result.toFixed(2))
        let color = PNL < 0 ? 'red' : 'green';
        if (l.Det) {
          l.text = `${l.Det}<br/>(<strong class="${color}">${PNL}</strong>) (${tEnt.toFixed(2)}-${tExt.toFixed(2)} = ${result.toFixed(2)}) - Brk: ${l.Brk} <br/>${l.Er}, Orders: ${l.OC}, Lots: ${l.Lt}, Qty: ${l.Qt}` + (l.Ft != null ? `<br/>(${l.Ft})` : '');
          l.calculatedPNL = parseFloat(PNL.toFixed(2));
          p.__pnl += parseFloat(PNL.toFixed(2));
        } else {
          l.text = '-';
          l.calculatedPNL = 0;
          p.__pnl += 0;
        }
      }
      if (Slp == 0 && p._pnl != p.__pnl) {
        console.log("PNL Error->", d.RD, p.ON, p._pnl, p.__pnl, p);
      }
      p.active = true;
      dayActiveFlag = true;
      DP += p.__pnl;
      // DP2 += p.__pnl;
      MaxPNL += p._max;
      MinPNL += p._min;
      // Added by Ajay for portfolio wise data
      if (d.active && !d.tmpInactive) {
        !(p.ON in $_json.portfolio_data) && ($_json.portfolio_data[p.ON] = {});
        !("pnl" in $_json.portfolio_data[p.ON]) && ($_json.portfolio_data[p.ON]["pnl"] = []);
        !("max" in $_json.portfolio_data[p.ON]) && ($_json.portfolio_data[p.ON]["max"] = []);
        !("min" in $_json.portfolio_data[p.ON]) && ($_json.portfolio_data[p.ON]["min"] = []);
        // $_json.portfolio_data[p.ON]["pnl"].push(p.__pnl)
        $_json.portfolio_data[p.ON]["pnl"].push({
          "time": {
            "day": dt,
            "month": mn,
            "year": yr
          },
          "value": p.__pnl
        })
        $_json.portfolio_data[p.ON]["max"].push(p._max)
        $_json.portfolio_data[p.ON]["min"].push(p._min)

      }
      // Added by Ajay for strategy wise temp data to be used at end of day
      if (d.active && !d.tmpInactive) {
        !(p.ST in temp_strategy) && (temp_strategy[p.ST] = 0);
        temp_strategy[p.ST] += p.__pnl;
        !(p.ST in $_json.strategy_data) && ($_json.strategy_data[p.ST] = {});
        !("options" in $_json.strategy_data[p.ST]) && ($_json.strategy_data[p.ST]["options"] = []);
        if ($_json.strategy_data[p.ST]["options"].indexOf(p.ON) === -1) $_json.strategy_data[p.ST]["options"].push(p.ON);
      }
    }
    d.lstActive = dayActiveFlag;
    d.DP = DP;
    d.MaxPNL = MaxPNL;
    d.MinPNL = MinPNL;

    //Added by Ajay to make strategy data with PNL as total of data
    for (let st of Object.keys(temp_strategy)) {
      !(st in $_json.strategy_data) && ($_json.strategy_data[st] = {});
      !("pnl" in $_json.strategy_data[st]) && ($_json.strategy_data[st]["pnl"] = []);
      $_json.strategy_data[st]["pnl"].push({
        "time": {
          "day": dt,
          "month": mn,
          "year": yr
        },
        "value": temp_strategy[st]
      })
    }
    // console.log("SD",$_json.strategy_data)``
    if (d.active && !d.tmpInactive) {
      $_json.graphPNL.push({
        day: d.RD,
        PNL: DP,
        year: yr,
        dayStr: dy,
        month: mn,
        monthStr: monthArray[mn - 1],
        graphDay: {
          day: dt,
          month: mn,
          year: yr
        }
      });
      // $_json.graphPNL.push({day:d.RD,PNL:DP,year:dx.getFullYear(),dayStr:dayArray[dx.getDay()],month:dx.getMonth(),monthStr:monthArray[dx.getMonth()],graphDay:{day:dx.getDate(),month:dx.getMonth()+1,year:dx.getFullYear()}});
    }

  }
}

function generateDrawDownData() {
  $_json.DrawDown = {
    graphData: [],
    monthly: {},
    weekly: {}
  };
  let sum = 0;
  for (d of $_json.graphPNL) {
    sum += d.PNL
    if (sum > 0) {
      sum = 0;
    }
    $_json.DrawDown.graphData.push({
      time: d.graphDay,
      value: sum ?? 0
    });
    $_json.DrawDown.monthly[d.year] = $_json.DrawDown.monthly[d.year] || {};
    $_json.DrawDown.monthly[d.year][d.monthStr] = $_json.DrawDown.monthly[d.year][d.monthStr] || [];
    $_json.DrawDown.monthly[d.year][d.monthStr].push($_json.DrawDown.graphData.length - 1);

    $_json.DrawDown.weekly[d.dayStr] = $_json.DrawDown.weekly[d.dayStr] || [];
    $_json.DrawDown.weekly[d.dayStr].push($_json.DrawDown.graphData.length - 1);
  }


  let mdd = calculateMDD(Object.keys($_json.DrawDown.graphData));
  let d1 = `${mdd.mddi.day}-${mdd.mddi.month}-${mdd.mddi.year}`;
  let d2 = `${mdd.time.day}-${mdd.time.month}-${mdd.time.year}`;
  $("#MaxDrawDown ._value").html(`${mdd.value} (${mdd.days}) <br/><small>${d1} to ${d2}</small>`)
}

function calculateMDD(index) {
  let data = [],
    mdd = 0,
    mdays = 0,
    mddi = null;
  // console.log($_json.DrawDown.graphData)
  for (let i of index) {
    data.push($_json.DrawDown.graphData[i]);
  }
  // console.log("MDDdata",data)
  if (data.length) {
    mdd = data.reduce(function(prev, curr) {
      return prev.value < curr.value ? prev : curr;
    });
  }

  for (let i = data.indexOf(mdd); i >= 0; i--) {
    if (data[i].value != 0) {
      mdays++;
    } else {
      mddi = data[i];
      break;
    }
  }
  if (!mddi) {
    mdays--;
    mddi = data[0];
  }
  return {
    time: mdd.time ?? '',
    value: (mdd.value ?? 0).toFixed(2),
    days: mdays,
    mddi: mddi?.time ?? ''
  };
}

// Made by Ajay
function generatePODrawDownData(passed_data) {
  data = []
  let sum = 0;
  for (d of passed_data) {
    sum += d.value
    if (sum > 0) {
      sum = 0;
    }
    data.push({
      time: d.time,
      value: sum ?? 0
    });
  }
  let mdd = calculatePOMDD(data);
  let d1 = `${mdd.mddi.day}-${mdd.mddi.month}-${mdd.mddi.year}`;
  let d2 = `${mdd.time.day}-${mdd.time.month}-${mdd.time.year}`;
  return `${mdd.value} (${mdd.days}) <br/><small>${d1} to ${d2}</small>`
}

function calculatePOMDD(passed_data) {
  let data = [],
    mdd = 0,
    mdays = 0,
    mddi = null;
  data = [...passed_data]
  if (data.length) {
    mdd = data.reduce(function(prev, curr) {
      return prev.value < curr.value ? prev : curr;
    });
  }

  for (let i = data.indexOf(mdd); i >= 0; i--) {
    if (data[i].value != 0) {
      mdays++;
    } else {
      mddi = data[i];
      break;
    }
  }
  if (!mddi) {
    mdays--;
    mddi = data[0];
  }
  return {
    time: mdd.time ?? '',
    value: (mdd.value ?? 0).toFixed(2),
    days: mdays,
    mddi: mddi?.time ?? ''
  };
}


function changePFData(e) {
  console.log("Portfolio changed", e)
  init();
}

function Slippages() {
  console.log("Slippages changed", $("#Slippages").val() + '%')
  init();
}

function changeDataState(index, e) {
  if (e.checked) {
    $_json[index].tmpInactive = false;
  } else {
    $_json[index].tmpInactive = true;
  }
  console.log("Temp disable", index, e.checked)
  init();
}
function loadRowData(index, elem){
  target = $(elem).children(".accordion-collapse")
  records= $_json[index].LR
  let [dataHTML, maxLeg] = generateTableRows(records);
  let html= "<table><tr>"
  for (let key in tblHeader) {
    if (key != "LD") {
      html += `<th>${tblHeader[key]}</th>`;
    }
  }
  for (let i = 1; i <= maxLeg; i++) {
    html += `<th>Leg ${i}</th>`;
  }
  html += '</tr>';
  html += dataHTML;
  html += `</table>`;
  console.log(target)
  target.html(html)
  console.log(html);
}
function changeDaysData(day) {
  $(event.target).toggleClass('selected');
  let isActive = $(event.target).hasClass('selected');
  setDayDataState();
  console.log("day changed", day, $(event.target).hasClass('selected'))
}

function setDayDataState() {
  let activeDays = [];
  let date1 = new Date($("#startDate").val());
  let date2 = new Date($("#endDate").val());
  $(".days .selected").each((i, e) => activeDays.push($(e).text()));
  for (d of $_json) {
    let rd = new Date(d.RD);
    if (activeDays.includes(d.Day)) {
      if (date1.toString() != 'Invalid Date' && date2.toString() == 'Invalid Date') {
        if (rd >= date1) {
          d.active = true;
          continue;
        }
      }
      if (date2.toString() != 'Invalid Date' && date1.toString() == 'Invalid Date') {
        if (rd <= date2) {
          d.active = true;
          continue;
        }
      }
      if (date1.toString() != 'Invalid Date' && date2.toString() != 'Invalid Date') {
        if (rd >= date1 && rd <= date2) {
          d.active = true;
          continue;
        }
      }
      if (date1.toString() == 'Invalid Date' && date2.toString() == 'Invalid Date') {
        d.active = true;
        continue;
      }
    }
    d.active = false;
  }
  init();
}



function generateProfitGraph() {
  let datax = [];
  let container = document.getElementById('graphProfit');
  for (let d of $_json.graphPNL) {
    datax.push({
      time: d.graphDay,
      open: 0,
      close: d.PNL ?? 0,
      low: 0,
      high: d.PNL ?? 0
    });
  }
  let chart = LightweightCharts.createChart(container, {
    width: (window.innerWidth - 50),
    height: 400,
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    }
  });
  let series = chart.addCandlestickSeries({
      upColor: '#0080004F',
      borderUpColor: '#008000',
      wickUpColor: '#008000',
      downColor: '#FF00004F',
      borderDownColor: '#FF0000',
      wickDownColor: '#FF0000',
    })
    .setData(datax);
  chart.timeScale().fitContent();

  $_json.graphGUI = $_json.graphGUI || {};
  $_json.graphGUI.ProfitGraph = {
    container,
    chart
  };

  addTooltip(container, chart)

}

function generateWeeklyGraph() {
  let label = [];
  let data = [];
  for (let d in $_json.WeeklyBreakup) {
    label.push(d);
    data.push($_json.WeeklyBreakup[d]);
  }
  $_json.graphGUI = $_json.graphGUI || {};
  $_json.graphGUI.WeekPNLGraph?.destroy();

  var ctx = document.getElementById("cnvWeekPNL").getContext('2d');
  $_json.graphGUI.WeekPNLGraph = new Chart(ctx, {
    type: 'bar',
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        }
      },
      scales: {
        myScale: {
          position: 'right', // `axis` is determined by the position as `'y'`
        }
      }
    },
    data: {
      labels: label,
      datasets: [{
        label: '',
        data: data,
        borderWidth: 2,
        borderRadius: 0,
        borderSkipped: false,
        borderColor: function(context) {
          const index = context.dataIndex;
          const value = context.dataset.data[index];
          return value < 0 ? '#ff0000' : '#008000'; // draw negative values in red else, alternate values in  green

        },
        backgroundColor: function(context) {
          const index = context.dataIndex;
          const value = context.dataset.data[index];
          return value < 0 ? '#ff000030' : '#00800030'; // draw negative values in red else, alternate values in  green

        },
      }]
    }
  });
}

function generateCumProfitGraph() {
  let datax = [];
  let sum = 0;
  let container = document.getElementById('graphCumProfit');
  for (let d of $_json.graphPNL) {
    sum += d.PNL
    datax.push({
      time: d.graphDay,
      value: sum ?? 0
    });
  }
  let chart = LightweightCharts.createChart(container, {
    width: (window.innerWidth - 50),
    height: 400
  });
  let series = chart.addLineSeries({
    lineWidth: '5'
  }).setData(datax);
  chart.timeScale().fitContent();

  $_json.graphGUI = $_json.graphGUI || {};
  $_json.graphGUI.CumProfitGraph = {
    container,
    chart
  };
  addTooltip(container, chart);
}

function generateDrawdownGraph() {
  let datax = [];
  for (let d of $_json.DrawDown.graphData) {
    // let x = new Date(d.time);
    datax.push({
      time: d.time,
      value: d.value
    })
  }
  let container = document.getElementById('graphDrawdown');
  let chart = LightweightCharts.createChart(container, {
    width: (window.innerWidth - 50),
    height: 400
  });
  let series = chart.addLineSeries({
    color: 'red',
    lineWidth: '5'
  }).setData(datax)
  // }).setData($_json.DrawDown.graphData)
  chart.timeScale().fitContent()
  addTooltip(container, chart, series, 'Drawdown');

  $_json.graphGUI = $_json.graphGUI || {};
  $_json.graphGUI.DrawDownGraph = {
    container,
    chart
  };
}

function resizeGraph() {
  for (let g in $_json.graphGUI) {
    let graph = $_json.graphGUI[g];
    graph.chart?.applyOptions({
      width: $(graph.container).width(),
      height: $(graph.container).height()
    })
    graph.chart?.timeScale().fitContent()
  }
}
window.addEventListener('resize', resizeGraph, true);

function addTooltip(container, chart) {

  let toolTipWidth = 80;
  let toolTipHeight = 80;
  let toolTipMargin = 15;

  let width = (window.innerWidth - 50);
  let height = 400;

  let toolTip = document.createElement('div');
  toolTip.className = 'floating-tooltip-2';
  container.appendChild(toolTip);

  // update tooltip
  chart.subscribeCrosshairMove(function(param) {
    //console.log("move",param)
    if (!param.time || param.point.x < 0 || param.point.x > width || param.point.y < 0 || param.point.y > height) {
      toolTip.style.display = 'none';
      return;
    }

    let dateStr = `${param.time.day} - ${monthArray[param.time.month-1]} - ${param.time.year}`;

    toolTip.style.display = 'block';
    let value = param.seriesPrices.values().next().value;
    value = value.high ? value.high : value;
    let color = value < 0 ? 'red' : 'green';
    //console.log()
    toolTip.innerHTML = `<div style="text-align: center;background: #ffffffa1;">
							<div style="color:${color};font-size: medium;font-weight: bold; margin: 4px 0px">${value.toFixed(2)}</div>
							<div>${dateStr}</div></div>`;

    var y = param.point.y;

    var left = param.point.x + toolTipMargin;
    if (left > width - toolTipWidth) {
      left = param.point.x - toolTipMargin - toolTipWidth;
    }

    var top = y + toolTipMargin;
    if (top > height - toolTipHeight) {
      top = y - toolTipHeight - toolTipMargin;
    }

    toolTip.style.left = left + 'px';
    toolTip.style.top = top + 'px';
  });
}

//initGraph();
init();

function init(redraw = true) {
  //return;
  $("#graphProfit").html('');
  $("#graphCumProfit").html('');
  $("#graphDrawdown").html('');

  $start_with_open_accordions ? $("#button_to_expand_collapse").text('Collapse all days') : $("#button_to_expand_collapse").text('Collapse all days');
  $start_with_open_accordions ? $("#button_to_expand_collapse").data('state', 1) : $("#button_to_expand_collapse").data('state', 0);

  generateDayData();
  generateDrawDownData();

  generateMonthlyBreakup();
  generateWeeklyBreakup();
  generateSummaryBreakup();
  generateStrategyBreakup();

  if (redraw) {
    let dtw = $("#data_table_wr").html('');
    // dtw.html(html);
    for (let i = 0; i < $_json.length; i++) {
      let html = generateTable($_json[i], i);
      dtw.append(html);
    }
    $('table').each((i, e) => {
      if ($(e).find('tr').length == 1) {
        $(e).closest('.data_table ').hide();
      }
    })
  }

  generateProfitGraph();
  generateWeeklyGraph();
  generateCumProfitGraph();
  generateDrawdownGraph();

  $("#data_graph_wr button").first().click().addClass('active');

  setColor($("#OverallProfit ._value").text(OverallProfit()));
  setColor($("#AvgExpiryProfit ._value").text(AvgExpiryProfit()));
  setColor($("#AvgDayProfit ._value").text(AvgDayProfit()));
  $("#MaxProfit ._value").text(MaxProfit());
  $("#MaxLoss ._value").text(MaxLoss());
  $("#TotalExpiries ._value").text(TotalExpiries());
  $("#Win ._value").text(Win());
  $("#Loss ._value").text(Loss());
  $("#MaxWinningStreak ._value").text(MaxWinningStreak());
  $("#MaxLosingStreak ._value").text(MaxLosingStreak());
  $("#AvgProfitOnWinDays ._value").text(AvgProfitOnWinDays());
  $("#AvgLossOnLossDays ._value").text(AvgLossOnLossDays());
  setColor($("#RewardToRisk ._value").text(RewardToRisk()));
  setColor($("#Expectancy ._value").text(Expectancy()));
}

function setColor(e) {
  if (parseFloat(e.text()) < 0) {
    $(e).closest('.card').addClass('red');
  } else {
    $(e).closest('.card').removeClass('red');
  }
}

/*******	caculations 	***********/
//{
function OverallProfit() {
  let sum = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      sum += d.DP;
    }
  }
  return (sum).toFixed(2);
}

function AvgExpiryProfit() {
  let count = 0;
  let sum = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      count++;
      sum += d.DP;
    }
  }
  return (sum / count).toFixed(2) == 'NaN' ? 0 : (sum / count).toFixed(2);
}

function AvgDayProfit() {
  let count = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      for (p of d.LR) {
        if (p.active) {
          count++;
        }
      }
    }
  }
  return (OverallProfit() / count).toFixed(2) == 'NaN' ? 0 : (OverallProfit() / count).toFixed(2);
}

function MaxProfit() {
  let max = 0;
  let maxDay="-"
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      if (d.DP>max){
        max=d.DP
        maxDay=d.RD
      }
    }
  }
  return `${(max).toFixed(2)} (${maxDay})`;
}

function MaxLoss() {
  let min = 0;
  let minDay="-"

  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      if (d.DP<min){
        min=d.DP
        minDay=d.RD
      }
    }
  }
  return `${(min).toFixed(2)} (${minDay})`;

}

function TotalExpiries() {
  let count = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      count++;
    }
  }
  return (count);
}

function Win() {
  let totalDays = 0;
  let daysPNL = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      totalDays++;
      if (d.DP >= 0) {
        daysPNL++;
      }
    }
  }
  return ((daysPNL * 100 / totalDays).toFixed(2) == 'NaN' ? 0 : (daysPNL * 100 / totalDays)).toFixed(2) + ` (${daysPNL})`;
  //return (totalDays*daysPNL/100).toFixed(2) + ` (${daysPNL})`;
}

function Loss() {
  let totalDays = 0;
  let daysPNL = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      totalDays++;
      if (d.DP < 0) {
        daysPNL++;
      }
    }
  }
  return ((daysPNL * 100 / totalDays).toFixed(2) == 'NaN' ? 0 : (daysPNL * 100 / totalDays)).toFixed(2) + ` (${daysPNL})`;
  //return (totalDays*daysPNL/100).toFixed(2) + ` (${daysPNL})`;
}

function MaxWinningStreak() {
  let max = 0;
  let pcount = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      if (d.DP >= 0) {
        pcount++;
      } else {
        max = Math.max(max, pcount);
        pcount = 0;
      }
    }
  }
  return Math.max(max, pcount);
}

function MaxLosingStreak() {
  let max = 0;
  let pcount = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      if (d.DP < 0) {
        pcount++;
      } else {
        max = Math.max(max, pcount);
        pcount = 0;
      }
    }
  }
  return Math.max(max, pcount);
}

function AvgProfitOnWinDays() {
  let sum = 0;
  let count = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      if (d.DP >= 0) {
        count++;
        sum += d.DP;
      }
    }
  }
  return (sum / count).toFixed(2) == 'NaN' ? 0 : (sum / count).toFixed(2);
}

function AvgLossOnLossDays() {
  let sum = 0;
  let count = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      if (d.DP < 0) {
        count++;
        sum += d.DP;
      }
    }
  }
  return (sum / count).toFixed(2) == 'NaN' ? 0 : (sum / count).toFixed(2);
}

function RewardToRisk() {
  let r2r = Math.abs(parseFloat(AvgProfitOnWinDays())) / Math.abs(parseFloat(AvgLossOnLossDays()));
  return (r2r).toFixed(2) == 'NaN' ? 0 : (r2r).toFixed(2)
}

function Expectancy() {
  let totalDays = 0;
  let daysLoss = daysProfit = 0;
  for (d of $_json) {
    if (d.active && d.lstActive !== false && d.tmpInactive !== true) {
      totalDays++;
      if (d.DP >= 0) {
        daysProfit++;
      } else {
        daysLoss++;
      }
    }
  }
  let win = (daysProfit * 100 / totalDays) == 'NaN' ? 0 : (daysProfit * 100 / totalDays);
  let loss = (daysLoss * 100 / totalDays) == 'NaN' ? 0 : (daysLoss * 100 / totalDays);
  let r2r = parseFloat(RewardToRisk());
  let exp = ((r2r * win) - loss) / 100;
  return (exp).toFixed(2) == 'NaN' ? 0 : (exp).toFixed(2);
}
//}

function openGraph(id) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(id).style.display = "block";
  if (event?.currentTarget) {
    event.currentTarget.className += " active";
  }
  resizeGraph();
}
