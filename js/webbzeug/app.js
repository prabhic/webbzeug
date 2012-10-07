(function() {
  var App, _ref;

  if ((_ref = window.Webbzeug) == null) {
    window.Webbzeug = {};
  }

  window.Webbzeug.Version = '0.0.1';

  window.Webbzeug.App = App = (function() {

    App.prototype.gridHeight = 27;

    App.prototype.gridWidth = 112 / 3;

    App.prototype.classMap = {
      rectangle: Webbzeug.Actions.Rectangle,
      circle: Webbzeug.Actions.Circle,
      fractal: Webbzeug.Actions.Fractal,
      pixels: Webbzeug.Actions.Pixels,
      flat: Webbzeug.Actions.Flat,
      combine: Webbzeug.Actions.Combine,
      invert: Webbzeug.Actions.Invert,
      contbri: Webbzeug.Actions.ContrastBrightness,
      blur: Webbzeug.Actions.Blur,
      rotozoom: Webbzeug.Actions.RotoZoom,
      light: Webbzeug.Actions.Light,
      mirror: Webbzeug.Actions.Mirror,
      load: Webbzeug.Actions.Load,
      save: Webbzeug.Actions.Save
    };

    function App(canvas) {
      this.canvas = canvas;
      this.context = this.canvas.getContext('2d');
      this.exporter = new Webbzeug.Exporter;
      this.handleSaveLoad();
      this.shiftPressed = false;
      this.incrementalIndex = 0;
      this.actions = [];
      this.width = this.context.canvas.width;
      this.height = this.context.canvas.height;
      this.handleNavigation();
      this.handleWorkspaceKeyboard();
      this.watchedActionIndex = null;
      this.selectedActionIndex = null;
      this.memory = [];
    }

    App.prototype.handleSaveLoad = function() {
      var _this = this;
      return $('.save-link').click(function() {
        var filename, url;
        if (filename = prompt('Please enter a filename:', 'workspace.webb')) {
          url = _this.exporter.actionsToDataURL(_this.actions);
          if (url != null) {
            return downloadDataURI({
              filename: filename,
              data: url
            });
          }
        }
      });
    };

    App.prototype.handleNavigation = function() {
      var self;
      self = this;
      return $('.navigation li').click(function(e) {
        e.preventDefault();
        self.handleWorkspaceClick();
        $(this).parent().find('li').removeClass('active');
        $(this).addClass('active');
        self.selectedActionId = $(this).attr('data-id');
        self.selectedActionName = $(this).text();
        return self.selectedActionType = $(this).attr('data-type');
      });
    };

    App.prototype.handleWorkspaceClick = function() {
      var _this = this;
      $('.workspace').mouseenter(function(e) {
        var dragger, el, x, y;
        if (!_this.selectedElement && _this.selectedActionId) {
          el = $('<div>').addClass('action');
          x = e.pageX;
          y = e.pageY;
          el.text(_this.selectedActionName).addClass(_this.selectedActionType).css({
            left: x,
            top: y
          });
          dragger = $('<div>').addClass('dragger').appendTo(el);
          $('.workspace').append(el);
          return _this.selectedElement = el;
        }
      });
      $('.workspace').mousemove(function(e) {
        var offsetX, offsetY;
        if (_this.selectedElement) {
          offsetX = $('.workspace').offset().left;
          offsetY = $('.workspace').offset().top;
          return _this.selectedElement.css({
            left: Math.floor((e.pageX - offsetX) / _this.gridWidth) * _this.gridWidth,
            top: Math.floor((e.pageY - offsetY) / _this.gridHeight) * _this.gridHeight
          });
        }
      });
      return $('.workspace').mousedown(function(e) {
        var action, element, x, y;
        $('.workspace').off('mouseenter mousemove mousedown');
        if (_this.selectedElement) {
          x = Math.round(_this.selectedElement.position().left / _this.gridWidth);
          y = Math.round(_this.selectedElement.position().top / _this.gridHeight);
          if (_this.selectedActionId) {
            action = new _this.classMap[_this.selectedActionId](_this, x, y, _this.incrementalIndex);
            action.index = _this.incrementalIndex;
            _this.selectedElement.attr({
              'data-index': _this.incrementalIndex
            });
            _this.incrementalIndex++;
            _this.actions.push(action);
            element = _this.selectedElement;
            _this.handleElementClick(null, element);
            _this.selectedElement.click(function(e) {
              return _this.handleElementClick(e, element);
            });
            _this.handleElementDrag(element);
          }
          _this.selectedElement = null;
          return _this.selectedActionId = _this.selectedActionType = _this.selectedActionName = null;
        }
      });
    };

    App.prototype.handleElementDrag = function(element) {
      var _this = this;
      $(element).find('.dragger').mousedown(function(e) {
        var editingElement;
        e.stopPropagation();
        editingElement = element;
        $('.workspace').mousemove(function(e) {
          var offsetX;
          offsetX = $('.workspace').offset().left;
          return editingElement.css({
            width: Math.floor((e.pageX - offsetX - editingElement.position().left) / _this.gridWidth) * _this.gridWidth - 12
          });
        });
        return $(document).mouseup(function(e) {
          var action;
          $('.workspace').off('mousemove');
          action = _this.actions[editingElement.attr('data-index')];
          return action.width = Math.round(editingElement.width() / _this.gridWidth);
        });
      });
      return $(element).mousedown(function(e) {
        var editingElement;
        editingElement = element;
        $('.workspace').mousemove(function(e) {
          var offsetX, offsetY;
          offsetX = $('.workspace').offset().left;
          offsetY = $('.workspace').offset().top;
          return editingElement.css({
            left: Math.floor((e.pageX - offsetX) / _this.gridWidth) * _this.gridWidth,
            top: Math.floor((e.pageY - offsetY) / _this.gridHeight) * _this.gridHeight
          });
        });
        return $(document).mouseup(function(e) {
          var action;
          $('.workspace').off('mousemove');
          action = _this.actions[editingElement.attr('data-index')];
          action.x = Math.round(editingElement.position().left / _this.gridWidth);
          return action.y = Math.round(editingElement.position().top / _this.gridHeight);
        });
      });
    };

    App.prototype.handleWorkspaceKeyboard = function() {
      var _this = this;
      $(document).keyup(function(e) {
        if (e.keyCode === 16) {
          return _this.shiftPressed = false;
        }
      });
      return $(document).keydown(function(e) {
        if (e.keyCode === 16) {
          _this.shiftPressed = true;
        }
        if (e.keyCode === 32) {
          e.preventDefault();
          if (_this.selectedActionIndex) {
            $('.workspace .action').removeClass('watched');
            $('.workspace .action[data-index=' + _this.selectedActionIndex + ']').addClass('watched');
            _this.watchedActionIndex = _this.selectedActionIndex;
            return _this.renderAll();
          }
        }
      });
    };

    App.prototype.handleElementClick = function(e, element) {
      this.selectedActionIndex = element.attr('data-index');
      $('.workspace .action').removeClass('selected');
      $(element).addClass('selected');
      if (this.shiftPressed) {
        return this.showParameters(e, this.actions[this.selectedActionIndex]);
      }
    };

    App.prototype.showParameters = function(e, action) {
      var attributes, availableParameters, color, info, input, key, label, li, optKey, option, select, self, settingsUl, settingsWindow, val, value, _ref1, _results,
        _this = this;
      self = this;
      settingsWindow = $('.workspace-wrapper .parameters');
      settingsWindow.show().css({
        left: (action.x + action.width + 1) * this.gridWidth + $('.workspace-wrapper').offset().left,
        top: (action.y + 1) * this.gridHeight + $('.workspace-wrapper').offset().top
      });
      settingsWindow.click(function(e) {
        return e.stopPropagation();
      });
      e.stopPropagation();
      $(document).click(function(e) {
        settingsWindow.hide();
        return $(document).off('click');
      });
      settingsUl = settingsWindow.find('ul');
      settingsUl.empty();
      availableParameters = action.availableParameters();
      _results = [];
      for (key in availableParameters) {
        info = availableParameters[key];
        switch (info.type) {
          case 'enum':
            li = $('<li>').appendTo(settingsUl);
            label = $('<div>').addClass('label').text((info.name || key) + ':').appendTo(li);
            select = $('<select>').appendTo(li);
            _ref1 = info.values;
            for (optKey in _ref1) {
              val = _ref1[optKey];
              option = $('<option>').attr({
                value: optKey
              }).text(val).appendTo(select);
              if (action.getParameter(key) === optKey) {
                option.attr('selected', 'selected');
              }
            }
            _results.push((function() {
              var _key;
              _key = key;
              return select.change(function() {
                action.setParameter(_key, select.val());
                return self.renderAll();
              });
            })());
            break;
          case 'number':
            li = $('<li>').appendTo(settingsUl);
            label = $('<div>').addClass('label').text((info.name || key) + ':').appendTo(li);
            attributes = {
              type: 'range',
              min: info.min || 0,
              max: info.max || 9999,
              value: action.getParameter(key) || info["default"],
              step: info.step || 1
            };
            input = $('<input>').attr(attributes).appendTo(li);
            value = $('<div>').addClass('value').text(attributes.value).appendTo(li);
            _results.push((function() {
              var _input, _key, _value;
              _input = input;
              _key = key;
              _value = value;
              return _input.change(function() {
                var newVal;
                newVal = _input.val();
                action.setParameter(_key, newVal);
                _value.text(newVal);
                return self.renderAll();
              });
            })());
            break;
          case 'color':
            li = $('<li>').appendTo(settingsUl);
            label = $('<div>').addClass('label').text((info.name || key) + ':').appendTo(li);
            color = action.getParameter(key) || info["default"];
            input = $('<div>').addClass('colorpicker-control').css({
              backgroundColor: color
            }).appendTo(li);
            _results.push((function() {
              var _input, _key;
              _key = key;
              _input = input;
              return _input.ColorPicker({
                color: color,
                onChange: function(hsb, hex, rgb) {
                  color = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
                  _input.css({
                    backgroundColor: color
                  });
                  action.setParameter(_key, color);
                  return self.renderAll();
                }
              });
            })());
            break;
          default:
            _results.push(void 0);
        }
      }
      return _results;
    };

    App.prototype.deleteTree = function() {
      var action, _i, _len, _ref1, _results;
      _ref1 = this.actions;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        action = _ref1[_i];
        _results.push(action.deleteChildren());
      }
      return _results;
    };

    /*
        Helper functions for actions
    */


    App.prototype.getWidth = function() {
      return this.canvas.width;
    };

    App.prototype.getHeight = function() {
      return this.canvas.height;
    };

    /*
        Tree building / handling
    */


    App.prototype.buildTree = function() {
      var watchedAction;
      if (!this.watchedActionIndex) {
        return;
      }
      this.deleteTree();
      watchedAction = this.actions[this.watchedActionIndex];
      return this.findChildrenRecursively(watchedAction);
    };

    App.prototype.findChildrenRecursively = function(action) {
      var children, possibleChildAction, _i, _len, _ref1;
      children = [];
      _ref1 = this.actions;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        possibleChildAction = _ref1[_i];
        if (possibleChildAction === action) {
          continue;
        }
        if (possibleChildAction.y === action.y - 1) {
          if (!(possibleChildAction.x >= action.x + action.width || possibleChildAction.x + possibleChildAction.width <= action.x)) {
            children.push(possibleChildAction);
            this.findChildrenRecursively(possibleChildAction);
          }
        }
      }
      return action.children = children;
    };

    App.prototype.renderAll = function() {
      var context, imageData, watchedAction;
      this.buildTree();
      watchedAction = this.actions[this.watchedActionIndex];
      if (watchedAction == null) {
        return false;
      }
      context = this.render(watchedAction);
      imageData = context.getImageData(0, 0, this.getWidth(), this.getHeight());
      return this.context.putImageData(imageData, 0, 0);
    };

    App.prototype.render = function(action) {
      var child, children, context, contexts, _i, _len;
      if (action == null) {
        return false;
      }
      children = action.children;
      contexts = [];
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        context = this.render(child);
        contexts.push(context);
      }
      context = action.render(contexts);
      return context;
    };

    return App;

  })();

}).call(this);
