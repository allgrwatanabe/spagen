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
  var subsidyTypeWrap  = document.getElementById('subsidyTypeWrap');
  var subsidyType      = document.getElementById('subsidyType');
  var subsidyNotice    = document.getElementById('subsidyNotice');
  var radioLabelNone   = document.getElementById('radioLabelNone');
  var radioLabelUse    = document.getElementById('radioLabelUse');
  var btnCalc          = document.getElementById('btnCalc');
  var btnBack          = document.getElementById('btnBack');
  var screenInput      = document.getElementById('screen-input');
  var screenResult     = document.getElementById('screen-result');

  // ガス代：5,500円 ÷ 2,000本 + 水道0.1円 = 2.85円/本
  var GAS_PER_BOTTLE = (5500 / 2000) + 0.1;

  var SUBSIDY = {
    normal: { label: '通常枠',       limit: 500000,  rate: 2/3 },
    wage:   { label: '賃金引上げ枠', limit: 2000000, rate: 2/3 }
  };

  // スライダー ↔ 数値入力の連動（0残り問題対応）
  rangeUsage.addEventListener('input', function () { numUsage.value = rangeUsage.value; });
  numUsage.addEventListener('focus',   function () { if (this.value === '0') this.value = ''; });
  numUsage.addEventListener('input',   function () { rangeUsage.value = this.value || 1; });
  numUsage.addEventListener('blur',    function () {
    if (!this.value || parseInt(this.value) <= 0) { this.value = 1; rangeUsage.value = 1; }
  });

  // 販売価格 自由入力切替
  function syncCostWrap() {
    customCostWrap.style.display = dispenserSel.value === 'custom' ? 'block' : 'none';
    if (dispenserSel.value !== 'custom') customCost.classList.remove('error');
  }
  dispenserSel.addEventListener('change', syncCostWrap);
  dispenserSel.addEventListener('input',  syncCostWrap);

  // フィルター代 自由入力切替
  function syncFilterWrap() {
    customFilterWrap.style.display = filterSel.value === 'custom' ? 'block' : 'none';
    if (filterSel.value !== 'custom') customFilter.classList.remove('error');
  }
  filterSel.addEventListener('change', syncFilterWrap);
  filterSel.addEventListener('input',  syncFilterWrap);

  // 補助金 ラジオボタン切替
  function getSubsidyUse() {
    var radios = document.querySelectorAll('input[name="subsidyUse"]');
    for (var i = 0; i < radios.length; i++) { if (radios[i].checked) return radios[i].value; }
    return 'none';
  }

  function syncSubsidy() {
    var use = getSubsidyUse() === 'use';
    radioLabelNone.className = 'radio-label' + (use ? '' : ' selected');
    radioLabelUse.className  = 'radio-label' + (use ? ' selected' : '');
    subsidyTypeWrap.classList[use ? 'remove' : 'add']('hidden');
    subsidyNotice.style.display = use ? 'block' : 'none';
  }

  document.querySelectorAll('input[name="subsidyUse"]').forEach(function (r) {
    r.addEventListener('change', syncSubsidy);
  });

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

  // 測定ボタン
  btnCalc.addEventListener('click', function () {
    var usage = parseFloat(numUsage.value)    || 0;
    var price = parseFloat(bottlePrice.value) || 0;
    var cost, filter;

    if (dispenserSel.value === 'custom') {
      cost = parseFloat(customCost.value) || 0;
      if (cost <= 0) { customCost.classList.add('error'); customCost.focus(); return; }
      customCost.classList.remove('error');
    } else {
      cost = parseFloat(dispenserSel.value) || 0;
    }

    if (filterSel.value === 'custom') {
      filter = parseFloat(customFilter.value) || 0;
      if (filter < 7700) { customFilter.classList.add('error'); customFilter.focus(); return; }
      customFilter.classList.remove('error');
    } else {
      filter = parseFloat(filterSel.value) || 0;
    }

    var monthlyPet    = usage * price * 30;
    var monthlyDisp   = (usage * GAS_PER_BOTTLE * 30) + ((filter * 2) / 12);
    var monthlySaving = monthlyPet - monthlyDisp;

    document.getElementById('r-usage').textContent  = usage + ' 本/日';
    document.getElementById('r-price').textContent  = fmtYen(price) + '/本';
    document.getElementById('r-cost').textContent   = fmtYen(cost);
    document.getElementById('r-filter').textContent = fmtYen(filter) + '/本';

    document.getElementById('r-monthly-pet').textContent  = fmtYen(monthlyPet);
    document.getElementById('r-monthly-disp').textContent = fmtYen(monthlyDisp);
    var ms = document.getElementById('r-monthly-saving');
    ms.textContent = fmtYen(monthlySaving);
    ms.className   = 'cval ' + (monthlySaving >= 0 ? 'green' : 'red');

    document.getElementById('r-yearly-pet').textContent  = fmtYen(monthlyPet  * 12);
    document.getElementById('r-yearly-disp').textContent = fmtYen(monthlyDisp * 12);
    var ys = document.getElementById('r-yearly-saving');
    ys.textContent = fmtYen(monthlySaving * 12);
    ys.className   = 'cval ' + (monthlySaving >= 0 ? 'green' : 'red');

    document.getElementById('r-initial').textContent = fmtYen(cost);

    var roiEl = document.getElementById('r-roi');
    roiEl.textContent = calcRoi(cost, monthlySaving);
    roiEl.className   = 'rvalue' + (monthlySaving > 0 ? '' : ' red');

    var useSubsidy = getSubsidyUse() === 'use';
    var sub        = useSubsidy ? (SUBSIDY[subsidyType.value] || SUBSIDY.normal) : null;
    var subAmt     = useSubsidy ? Math.min(cost * sub.rate, sub.limit) : 0;

    if (useSubsidy && subAmt > 0) {
      document.getElementById('r-subsidy-amount').textContent = '−' + fmtYen(subAmt) + '（' + sub.label + '）';
      document.getElementById('r-net-cost').textContent       = fmtYen(cost - subAmt);
      var rs = document.getElementById('r-roi-subsidy');
      rs.textContent = calcRoi(cost - subAmt, monthlySaving);
      rs.className   = 'rvalue' + (monthlySaving > 0 ? ' green' : ' red');
      document.getElementById('subsidy-block').classList.remove('hidden');
      document.getElementById('roi-subsidy-block').classList.remove('hidden');
      document.getElementById('roi-label').textContent = '補助金なしの回収期間';
    } else {
      document.getElementById('subsidy-block').classList.add('hidden');
      document.getElementById('roi-subsidy-block').classList.add('hidden');
      document.getElementById('roi-label').textContent = '初期費用の回収期間';
    }

    screenInput.classList.add('hidden');
    screenResult.classList.remove('hidden');
    window.scrollTo(0, 0);
  });

  // 戻るボタン
  btnBack.addEventListener('click', function () {
    screenResult.classList.add('hidden');
    screenInput.classList.remove('hidden');
    window.scrollTo(0, 0);
  });
});
