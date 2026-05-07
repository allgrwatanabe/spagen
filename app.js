document.addEventListener('DOMContentLoaded', function () {
  var rangeUsage    = document.getElementById('rangeUsage');
  var numUsage      = document.getElementById('numUsage');
  var bottlePrice   = document.getElementById('bottlePrice');
  var dispenserSel  = document.getElementById('dispenserCost');
  var customCostWrap= document.getElementById('customCostWrap');
  var customCost    = document.getElementById('customCost');
  var filterPrice   = document.getElementById('filterPrice');
  var subsidyType   = document.getElementById('subsidyType');
  var btnCalc       = document.getElementById('btnCalc');
  var btnBack       = document.getElementById('btnBack');
  var screenInput   = document.getElementById('screen-input');
  var screenResult  = document.getElementById('screen-result');

  // ガス代：5,500円 ÷ 2,000本 + 水道0.1円 = 2.85円/500ml
  var GAS_PER_BOTTLE = (5500 / 2000) + 0.1;

  // 補助金設定
  var SUBSIDY = {
    none:   { label: 'なし',           limit: 0,      rate: 0 },
    normal: { label: '通常枠',         limit: 500000, rate: 2/3 },
    wage:   { label: '賃金引上げ枠',   limit: 2000000,rate: 2/3 }
  };

  rangeUsage.addEventListener('input', function () { numUsage.value = rangeUsage.value; });
  numUsage.addEventListener('input',   function () { rangeUsage.value = numUsage.value; });

  function syncCustomWrap() {
    if (dispenserSel.value === 'custom') {
      customCostWrap.style.display = 'block';
    } else {
      customCostWrap.style.display = 'none';
      customCost.classList.remove('error');
    }
  }
  dispenserSel.addEventListener('change', syncCustomWrap);
  dispenserSel.addEventListener('input',  syncCustomWrap);

  function fmtYen(n) {
    return '¥' + Math.round(n).toLocaleString('ja-JP');
  }

  function calcRoi(cost, monthlySaving) {
    if (monthlySaving <= 0) return '削減効果なし';
    var totalMonths = cost / monthlySaving;
    var years  = Math.floor(totalMonths / 12);
    var months = Math.ceil(totalMonths % 12);
    var txt = '';
    if (years  > 0) txt += years  + '年';
    if (months > 0) txt += months + 'ヶ月';
    if (txt === '')  txt = '1ヶ月未満';
    return txt;
  }

  btnCalc.addEventListener('click', function () {
    var usage  = parseFloat(numUsage.value)    || 0;
    var price  = parseFloat(bottlePrice.value) || 0;
    var filter = parseFloat(filterPrice.value) || 0;
    var cost;

    if (dispenserSel.value === 'custom') {
      cost = parseFloat(customCost.value) || 0;
      if (cost <= 0) {
        customCost.classList.add('error');
        customCost.focus();
        return;
      }
      customCost.classList.remove('error');
    } else {
      cost = parseFloat(dispenserSel.value) || 0;
    }

    // 月間コスト計算（30日換算）
    var monthlyPet      = usage * price * 30;
    var monthlyGas      = usage * GAS_PER_BOTTLE * 30;
    var monthlyFilter   = (filter * 2) / 12;
    var monthlyDisp     = monthlyGas + monthlyFilter;
    var monthlySaving   = monthlyPet - monthlyDisp;

    // 年間コスト
    var yearlyPet     = monthlyPet  * 12;
    var yearlyDisp    = monthlyDisp * 12;
    var yearlySaving  = monthlySaving * 12;

    // 補助金計算
    var subsidy     = SUBSIDY[subsidyType.value] || SUBSIDY.none;
    var subsidyAmt  = Math.min(cost * subsidy.rate, subsidy.limit);
    var netCost     = cost - subsidyAmt;

    // 結果セット
    document.getElementById('r-usage').textContent   = usage + ' 本/日';
    document.getElementById('r-price').textContent   = fmtYen(price) + '/本';
    document.getElementById('r-cost').textContent    = fmtYen(cost);
    document.getElementById('r-filter').textContent  = fmtYen(filter) + '/本';

    document.getElementById('r-monthly-pet').textContent   = fmtYen(monthlyPet);
    document.getElementById('r-monthly-disp').textContent  = fmtYen(monthlyDisp);
    var mSavEl = document.getElementById('r-monthly-saving');
    mSavEl.textContent = fmtYen(monthlySaving);
    mSavEl.className = 'cval ' + (monthlySaving >= 0 ? 'green' : 'red');

    document.getElementById('r-yearly-pet').textContent    = fmtYen(yearlyPet);
    document.getElementById('r-yearly-disp').textContent   = fmtYen(yearlyDisp);
    var ySavEl = document.getElementById('r-yearly-saving');
    ySavEl.textContent = fmtYen(yearlySaving);
    ySavEl.className = 'cval ' + (yearlySaving >= 0 ? 'green' : 'red');

    document.getElementById('r-initial').textContent = fmtYen(cost);

    // 回収期間（補助金なし）
    var roiEl = document.getElementById('r-roi');
    var roiText = calcRoi(cost, monthlySaving);
    roiEl.textContent = roiText;
    roiEl.className = 'rvalue' + (monthlySaving > 0 ? '' : ' red');

    // 補助金ブロック
    var subsidyBlock    = document.getElementById('subsidy-block');
    var roiSubsidyBlock = document.getElementById('roi-subsidy-block');
    var roiLabel        = document.getElementById('roi-label');

    if (subsidy.rate > 0 && subsidyAmt > 0) {
      document.getElementById('r-subsidy-amount').textContent = '−' + fmtYen(subsidyAmt) + '（' + subsidy.label + '）';
      document.getElementById('r-net-cost').textContent = fmtYen(netCost);

      var roiSubsidyEl = document.getElementById('r-roi-subsidy');
      var roiSubsidyText = calcRoi(netCost, monthlySaving);
      roiSubsidyEl.textContent = roiSubsidyText;
      roiSubsidyEl.className = 'rvalue' + (monthlySaving > 0 ? ' green' : ' red');

      subsidyBlock.classList.remove('hidden');
      roiSubsidyBlock.classList.remove('hidden');
      roiLabel.textContent = '補助金なしの回収期間';
    } else {
      subsidyBlock.classList.add('hidden');
      roiSubsidyBlock.classList.add('hidden');
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
