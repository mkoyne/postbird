global.DbScreenView = jClass.extend({
  init: function (handler) {
    this.handler = handler;

    this.content = $u(App.renderView('main'));

    this.databaseSelect = this.content.find('.databases select');
    this.tablesList = this.content.find('.sidebar .tables ul');
    this.sidebar = this.content.find('.sidebar');

    this.topTabs = this.content.find('.main > .window-tabs > .tab, .sidebar ul.extras li:not(.bottom)');
    this.tabContents = this.content.find('.main > .window-content');

    this.initializePanes();
    this.initEvents();
  },

  initEvents: function() {
    this.topTabs.each(function(i, el) {
      $u(el).bind('click', function(e) {
        var tabName = $u(e.target).attr('tab');
        e.preventDefault();
        this.showTab(tabName);
      }.bind(this));
    }.bind(this));

    this.sidebar.find('a.addTable').bind('click', this.newTableDialog.bind(this));

    this.databaseSelect.bind('change', function (e) {
      var value = '' + $u(e.target).val();

      if (value == '' || value == '**create-db**') {
        this.sidebar.removeClass('database-selected');
      } else {
        this.sidebar.addClass('database-selected');
      }

      if (value == '**create-db**') {
        e.preventDefault();
        new Dialog.NewDatabase(this.handler);
        $u(e.target).val('');
      } else if (value != '') {
        this.handler.selectDatabase(value);
      }
    }.bind(this));
  },

  initializePanes: function () {
    ['Users', 'Extensions', 'Query', 'Structure'].forEach(function(paneName) {
      this[paneName.toLowerCase()] = new global.Panes[paneName](this);
    }.bind(this));
  },

  renderDbList: function (databases) {
    this.databaseSelect.empty();
    this.databaseSelect.append($u('<option>'))

    databases.forEach(function(dbname) {
      this.databaseSelect.append($dom(
        ['option', {value: dbname}, dbname]
      ));
    }.bind(this));

    this.databaseSelect.append($dom(
      ['option', {disabled: true}, '-----']
    ));

    this.databaseSelect.append($dom(
      ['option', {value: '**create-db**'}, 'Create database']
    ));
  },

  renderTablesAndSchemas: function (data) {
    this.tablesList.empty();
    var _this = this;
    $u.each(data, function (schema, tables) {
      var schemaTree = DOMinate(['li', ['span', schema], {'schema-name': schema}, ['ul$list']]);
      if (schema == 'public') $u(schemaTree[0]).addClass('open');

      $u(schemaTree[0]).find('span').bind('click', function() {
        $u(schemaTree[0]).toggleClass('open');
      });

      data[schema].forEach(function(table) {
        var tableNode = $dom(['li', table.table_name, {'table-name': table.table_name}]);

        $u(tableNode).single_double_click(function(e) {
          e.preventDefault();
          _this.handler.tableSelected(schema, table.table_name, tableNode);
        }, function(e) {
          e.preventDefault();
          _this.renameTable(tableNode, table.table_name);
        });

        $u.contextMenu(tableNode, {
          'View': function () {
            _this.handler.tableSelected(schema, table.table_name, tableNode);
          },
          'separator': 'separator',
          'Rename': function () {
            _this.renameTable(tableNode, table.table_name);
          },
          'Truncate table' : function () {},
          'Drop table': function() {
            _this.handler.dropTable(schema, table.table_name);
          },
          'Show table SQL': function () {}
        });

        $u(schemaTree.list).append(tableNode);
      });

      _this.tablesList.append(schemaTree[0]);
    });
  },

  renameTable: function (node, tableName) {
    node = $u(node);
    node.html('<input value="' + tableName + '" type=text>');
    var input = node.find('input');
    input.focus();
    setTimeout(function() {
      input[0].selectionStart = input[0].selectionEnd;
    }, 20)
    input.bind('keypress', function(e) {
      if (e.keyCode == 13) {
        var newValue = e.target.value;
        node.html(e.target.value);
        // Enter pressed... do anything here...
      }
    });
  },

  showTab: function(name) {
    if (this.currentTab) {
      this.topTabs.filter('.' + this.currentTab).removeClass('active');
      this.tabContents.filter('.' + this.currentTab).removeClass('active');
    }

    this.topTabs.filter('.' + name).addClass('active');
    this.tabContents.filter('.' + name).addClass('active');
    this.currentTab = name;

    console.log(name + 'TabActivate', typeof this.handler[name + 'TabActivate']);
    if (this.handler[name + 'TabActivate']) this.handler[name + 'TabActivate']();
  },

  setTabContent: function (tabName, content) {
    var container = this.tabContents.filter('.' + tabName);
    container.empty().append(content);
  },

  tabContent: function (tabName) {
    return this.tabContents.filter('.' + tabName);
  },

  renderContentTab: function (data) {
    var node = App.renderView('content_tab', {data: data});
    this.setTabContent('content', node);
    var content = this.tabContent('content');
    content.find('span.text').bind('dblclick', function(e) {
      $u.stopEvent(e);
      $u(e.target.parentNode).toggleClass('expanded');
    });
  },

  newTableDialog: function () {
    new Dialog.NewTable(this.handler);
  }
});