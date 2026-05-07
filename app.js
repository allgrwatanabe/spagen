document.addEventListener('DOMContentLoaded', function () {
  var rangeUsage       = document.getElementById('rangeUsage');
  var numUsage         = document.getElementById('numUsage');
  var bottlePrice      = document.getElementById('bottlePrice');
  var dispenserSel     = document.getElementById('dispenserCost');
  var customCostWrap   = document.getElementById('customCostWrap');
  var customCost       = document.getElementById('customCost');
  var filterSel        = document.getElementById('filterPrice');
  var customFilterWrap = document.getElementById('customFilterWrap');
  var customFilter     = document.getElementById('customFilter');
  var subsidyType      = document.getElementById('subsidyType');
  var btnCalc          = document.getElementById('btnCalc');
  var btnBack          = document.getElementById('btnBack');
  var screenInput      = document.getElementById('screen-input');
  var screenResult     = document.getElementById('screen-result');

  // ガス代：5,500円 ÷ 2,000本 + 水道0.1円 = 2.85円/500ml
  var GAS_PER_BOTTLE = (5500 / 2000) + 0.1;

  var SUBSIDY = {
    none:   { label: 'なし',         limit: 0,       rate: 0   },
    normal: { label: '通常枠',       limit: 500000,  rate: 2/3 },
    wage:   { label: '賃金引上げ枠', limit: 2000000, rate: 2/3 }
  };

  rangeUsage.addEventListener('input', function () { numUsage.value = rangeUsage.value; });
  numUsage.addEventListener('input',   function () { rangeUsage.value = numUsage.value; });

  function syncCostWrap() {
    customCostWrap.style.display = dispenserSel.value === 'custom' ? 'block' : 'none';
    if (dispenserSel.value !== 'custom') customCost.classList.remove('error');
  }
  dispenserSel.addEventListener('change', syncCostWrap);
  dispenserSel.addEventListener('input',  syncCostWrap);

  function syncFilterWrap() {
    customFilterWrap.style.display = filterSel.value === 'custom' ? 'block' : 'none';
    if (filterSel.value !== 'custom') customFilter.classList.remove('error');
  }
  filterSel.addEventListener('change', syncFilterWrap);
  filterSel.addEventListener('input',  syncFilterWrap);

  function fmtYen(n) {
    return '¥' + Math.round(n).toLocaleString('ja-JP');
  }

  function calcRoi(cost, saving) {
    if (saving <= 0) return '削減効果なし';
    var tm = cost / saving;
    var y  = Math.floor(tm / 12);
    var m  = Math.ceil(tm % 12);
    var t  = '';
    if (y > 0) t += y + '年';
    if (m > 0) t += m + 'ヶ月';
    return t || '1ヶ月未満';
  }

  btnCalc.addEventListener('click', function () {
    var usage = parseFloat(numUsage.value)    || 0;
    var price = parseFloat(bottlePrice.value) || 0;
    var cost, filter;

    // 販売価格の取得
    if (dispenserSel.value === 'custom') {
      cost = parseFloat(customCost.value) || 0;
      if (cost <= 0) { customCost.classList.add('error'); customCost.focus(); return; }
      customCost.classList.remove('error');
    } else {
      cost = parseFloat(dispenserSel.value) || 0;
    }

    // フィルター代の取得
    if (filterSel.value === 'custom') {
      filter = parseFloat(customFilter.value) || 0;
      if (filter < 7700) { customFilter.classList.add('error'); customFilter.focus(); return; }
      customFilter.classList.remove('error');
    } else {
      filter = parseFloat(filterSel.value) || 0;
    }

    // 月間コスト計算（30日換算）
    var monthlyPet    = usage * price * 30;
    var monthlyGas    = usage * GAS_PER_BOTTLE * 30;
    var monthlyFilter = (filter * 2) / 12;
    var monthlyDisp   = monthlyGas + monthlyFilter;
    var monthlySaving = monthlyPet - monthlyDisp;

    // 年間コスト
    var yearlyPet    = monthlyPet    * 12;
    var yearlyDisp   = monthlyDisp   * 12;
    var yearlySaving = monthlySaving * 12;

    // 補助金計算
    var sub      = SUBSIDY[subsidyType.value] || SUBSIDY.none;
    var subAmt   = Math.min(cost * sub.rate, sub.limit);
    var netCost  = cost - subAmt;

    // 結果セット
    document.getElementById('r-usage').textContent  = usage + ' 本/日';
    document.getElementById('r-price').textContent  = fmtYen(price) + '/本';
    document.getElementById('r-cost').textContent   = fmtYen(cost);
    document.getElementById('r-filter').textContent = fmtYen(filter) + '/本';

    document.getElementById('r-monthly-pet').textContent  = fmtYen(monthlyPet);
    document.getElementById('r-monthly-disp').textContent = fmtYen(monthlyDisp);
    var ms = document.getElementById('r-monthly-saving');
    ms.textContent = fmtYen(monthlySaving);
    ms.className   = 'cval ' + (monthlySaving >= 0 ? 'green' : 'red');

    document.getElementById('r-yearly-pet').textContent  = fmtYen(yearlyPet);
    document.getElementById('r-yearly-disp').textContent = fmtYen(yearlyDisp);
    var ys = document.getElementById('r-yearly-saving');
    ys.textContent = fmtYen(yearlySaving);
    ys.className   = 'cval ' + (yearlySaving >= 0 ? 'green' : 'red');

    document.getElementById('r-initial').textContent = fmtYen(cost);

    var roiEl = document.getElementById('r-roi');
    roiEl.textContent = calcRoi(cost, monthlySaving);
    roiEl.className   = 'rvalue' + (monthlySaving > 0 ? '' : ' red');

    var subBlock    = document.getElementById('subsidy-block');
    var roiSubBlock = document.getElementById('roi-subsidy-block');
    var roiLabel    = document.getElementById('roi-label');

    if (sub.rate > 0 && subAmt > 0) {
      document.getElementById('r-subsidy-amount').textContent = '−' + fmtYen(subAmt) + '（' + sub.label + '）';
      document.getElementById('r-net-cost').textContent       = fmtYen(netCost);
      var roiSub = document.getElementById('r-roi-subsidy');
      roiSub.textContent = calcRoi(netCost, monthlySaving);
      roiSub.className   = 'rvalue' + (monthlySaving > 0 ? ' green' : ' red');
      subBlock.classList.remove('hidden');
      roiSubBlock.classList.remove('hidden');
      roiLabel.textContent = '補助金なしの回収期間';
    } else {
      subBlock.classList.add('hidden');
      roiSubBlock.classList.add('hidden');
      roiLabel.textContent = '初期費用の回収期間';
    }

    screenInput.classList.add('hidden');
    screenResult.classList.remove('hidden');
    window.scrollTo(0, 0);
  });

  btnBack.addEventListener('click', function () {
    screenResult.classList.add('hidden');
    screenInput.classList.remove('hidden');
    window.scrollTo(0, 0);
  });
});
