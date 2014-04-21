;(function($, window, undefined) {
  /**
   * 多级联动select
   * @namespace jQuery
   * @constructor UnionSelect
   * @param {[Object]} options 参数对象
   * @param {[String]} options.url 获取数据的服务
   * @param {[Array|String]} options.selectArr select数组或取得select数组的选择器
   * @param {[String]} options.param url服务的参数名称，默认为"id"
   * @param {[Function]} options.callback 选完select选项后的回调，主要是根据选中的数据做业务处理
   * @param {[Function]} options.dataCallback 取完select数据后的回调函数，主要是根据请求回来的数据处理下一级联动select
   * @param {[Boolean]} options.debug 是否开启debug模式，默认为不开启
   * @return {[null]}
   * @example
   *  三级联动省市区
      var unionSelectTrade = new $.UnionSelect({
        url: "{:U('home/User/getTreeInfo', array('queryType'=>'trade'))}",
        param: "id",
        selectArr: $('ul[inputname="tradeId"] select'),
        callback: function($select, value) {
          var $trade = $('input[name="trade_id"]', $form);
          $trade.val(value);
          $form.submit();
        },
        dataCallback: function(json, $select) {
          var _this = this;
          if (json.boolen == 1) {
            var data = json['data'];
            if (data.length) {
              _this.createOptions({
                select: $select,
                data: data,
                valueProperty: "id",
                textProperty: "trade_name_cn"
              });
            }
          }
        }
      });
   */
  "use strict";
  var UnionSelect = function(options) {
    var _this = this;
    // 定义静态属性
    _this.opts = options;
    _this.url = options.url;
    _this.$selectArr = $(options.selectArr);
    _this.param = options.param || "id";
    _this.callback = options.callback || function() {};
    _this.dataCallback = options.dataCallback || function() {};

    _this.debug = options.debug;
    _this.init();
  };

  UnionSelect.prototype = {
    constructor: UnionSelect,
    init: function() {
      var _this = this;
      // 先给所有的select加上level属性
      _this.$selectArr.each(function(i) {
        $(this).attr('level', i + 1);
      });

      // 给select添加change事件
      _this.changeSelect();

      var $select = _this.$selectArr.eq(0);

      // 找出第一级的数据，并创建select的options
      $.getJSON(_this.url, function(json) {
        _this.dataCallback.call(_this, json, $select);
      });
    },
    createOptions: function(params) {
      var _this = this;
      var $select = $(params['select']);
      if (!$select.length) {
        _this.console("select为空！");
        return false;
      }
      var data = params['data'];
      var valueProperty = params['valueProperty'];
      var textProperty = params['textProperty'];

      if (!valueProperty) {
        valueProperty = "id";
      }
      if (!textProperty) {
        textProperty = "name_cn";
      }
      // 根据数据动态创建select的option
      if (data) {
        $.each(data, function(i) {
          var obj = this;
          var value = obj[valueProperty];
          var text = obj[textProperty];
          $select[0].options[i + 1] = new Option(text, value);
        });
      }
    },
    changeSelect: function() {
      var _this = this;
      _this.$selectArr.change(function() {
        var $this = $(this);

        // 找出下一级select
        var level = parseInt($this.attr('level'), 10) + 1;
        var $nextLevel = _this.$selectArr.filter('[level="' + level + '"]');
        if (!$nextLevel.length) {
          _this.console('已经是最后一级了！');
          return false;
        }

        var val = $this.val();

        // 选择后执行回调，处理当前选中的数据
        _this.callback.call(_this, $this, val);

        // 根据当前选中数据，处理下一级联动select
        var params = {};
        params[_this.param] = val;

        // 请求下一级数据
        $.getJSON(_this.url, params, function(json) {
          // 返回数据后，执行回调，对数据进行处理
          _this.dataCallback.call(_this, json, $nextLevel);
        }, 'json');
      });
    },
    console: function(msg) { // 输出错误信息到错误控制台
      var _this = this;
      if (window.console && _this.debug) {
        console.error(msg);
      }
    }
  };
  // 注入到jQuery这一namespace下
  jQuery.UnionSelect = UnionSelect;
})(jQuery, window);