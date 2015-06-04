/* global angular:false */
const adminApp = angular.module('HistoricalAerialsAdmin', ['ng-admin', 'ConfigApp']);

adminApp.config((RestangularProvider) => {
  //Configure Restangular to remove underscores from ng-admin's
  //paging, sorting, and filtering parameters
  RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
    function rmUnderscore(origParam) {
      if (origParam.indexOf('_') !== 0) {
        return;
      }
      if (params.hasOwnProperty(origParam)) {
        const newParam = origParam.substring(1);
        params[newParam] = params[origParam];
      }
      delete params[origParam];
    }

    if (operation === 'getList') {
      rmUnderscore('_page');
      rmUnderscore('_perPage');
      rmUnderscore('_sortDir');
      rmUnderscore('_sortField');
      rmUnderscore('_filters');
    }
    return { params: params };
  });
});

adminApp.config((NgAdminConfigurationProvider, COUNTIES, MEDIUMS, PRINT_TYPES, INDEX_TYPES) => {
  const nga = NgAdminConfigurationProvider;
  const app = nga.application('TNRIS Historical Aerial Imagery Admin');

  var customHeaderTemplate =
    `<div class="navbar-header">
      <a class="navbar-brand" ng-click="appController.displayHome()">
        TNRIS Historical Aerial Imagery Admin
      </a>
    </div>`;
  app.header(customHeaderTemplate);

  app.baseApiUrl('admin/api/');

  const countyChoices = Object.keys(COUNTIES).map((k) => {
    return {value: parseInt(k, 10), label: COUNTIES[k]};
  });

  const record = nga.entity('records');

  record.dashboardView()
    .title('Historical Aerial Imagery Records');

  const listShowFields = [
    nga.field('CountyFIPS')
      .label('County')
      .map((val) => COUNTIES[val] || 'UNKOWN'),
    nga.field('AcquiringAgency')
      .label('Acquiring Agency'),
    nga.field('Mission'),
    nga.field('Date', 'date'),
    nga.field('Scale', 'number'),
    nga.field('NumFrames', 'number')
          .label('# of Frames'),
    nga.field('IndexType', 'choice')
      .label('Index Type')
      .choices(INDEX_TYPES),
    nga.field('LocationCode')
      .label('Location Code'),
    nga.field('Medium', 'choice')
      .choices(MEDIUMS),
    nga.field('PrintType', 'choice')
      .label('Print Type')
      .choices(PRINT_TYPES)
  ];

  record.listView()
    .title('Historical Aerial Imagery Records')
    .fields(
      listShowFields
    )
    .filters([
      nga.field('CountyFIPS', 'choice')
        .label('County')
        .choices(countyChoices),
      nga.field('Year')
        .label('Min Year')
        .attributes({
          placeholder: 'Minimum Year',
          pattern: '(19|20)[0-9]{2,2}'
        })
    ])
    .batchActions([])
    .listActions(['show', 'edit']);

  record.showView()
    .title('Record Details')
    .fields(
      [nga.field('id').label('ID').isDetailLink(false)]
      .concat(listShowFields)
      .concat([
        nga.field('Created', 'datetime')
          .format('yyyy-MM-dd hh:mm:ss a'),
        nga.field('Modified', 'datetime')
          .format('yyyy-MM-dd hh:mm:ss a'),
        nga.field('Coverage', 'boolean'),
        nga.field('FrameSize', 'number')
          .label('Frame Size (inches)'),
        nga.field('IsPublic', 'boolean')
          .label('Public')
      ])
    )
    .actions(['edit']);


  const createEditFields = [
    nga.field('AcquiringAgency')
      .label('Acquiring Agency')
      .validation({required: true}),
    nga.field('CountyFIPS', 'choice')
      .label('County')
      .choices(countyChoices)
      .validation({required: true}),
    nga.field('Date', 'date')
      .validation({required: true}),
    nga.field('IsPublic', 'boolean')
      .label('Public')
      .defaultValue(true),
    nga.field('IndexType', 'choice')
      .label('Index Type')
      .choices(INDEX_TYPES),
    nga.field('LocationCode')
      .label('Location Code'),
    nga.field('Medium', 'choice')
      .choices(MEDIUMS),
    nga.field('PrintType', 'choice')
      .label('Print Type')
      .choices(PRINT_TYPES)
      .validation({required: true}),
    nga.field('NumFrames', 'number')
      .label('# of Frames')
      .validation({required: true}),
    nga.field('Remarks', 'text'),
    nga.field('Scale', 'number')
      .validation({required: true}),
    nga.field('Coverage', 'boolean'),
    nga.field('FrameSize', 'number')
      .label('Frame Size (inches)')
      .validation({required: true}),
    nga.field('Mission')
      .validation({required: true})
  ];

  record.editionView()
    .title('Edit Record')
    .actions(['show', 'delete'])
    .fields(
      [nga.field('id').label('ID').editable(false).isDetailLink(false)]
        .concat(createEditFields)
        .concat([
          nga.field('RSDIS')
            .editable(false),
          nga.field('Created', 'datetime')
            .format('yyyy-MM-dd hh:mm:ss a')
            .editable(false),
          nga.field('Modified', 'datetime')
            .format('yyyy-MM-dd hh:mm:ss a')
            .editable(false)
        ])
    );

  record.creationView()
    .title('Create New Record')
    .fields([].concat(createEditFields));

  app.addEntity(record);

  //---------------------
  const user = nga.entity('users');

  user.listView().title('Admin Users')
    .fields([
      nga.field('emailAddress')
        .label('Email Address')
        .isDetailLink(true),
      nga.field('Created', 'datetime')
        .format('yyyy-MM-dd hh:mm:ss a'),
      nga.field('Modified', 'datetime')
        .format('yyyy-MM-dd hh:mm:ss a')
    ])
    .batchActions([])
    .listActions(['show', 'edit']);

  user.creationView().title('Create User')
    .fields([
      nga.field('emailAddress', 'email')
        .label('Email Address')
        .validation({required: true}),
      nga.field('password', 'password')
        .label('Password')
        .validation({required: true, minlength: 6}),
      nga.field('repeatPassword', 'password')
        .label('Repeat Password')
        .validation({required: true, minlength: 6})
    ]);

  user.showView().title('User')
    .fields([
      nga.field('emailAddress', 'email')
        .label('Email Address'),
      nga.field('Created', 'datetime')
        .format('yyyy-MM-dd hh:mm:ss a'),
      nga.field('Modified', 'datetime')
        .format('yyyy-MM-dd hh:mm:ss a')
    ])
    .actions(['edit']);

  user.editionView()
    .title('Edit User')
    .actions(['show', 'delete'])
    .fields([
      nga.field('emailAddress', 'email')
        .label('Email Address')
        .validation({required: true}),
      nga.field('password', 'password')
        .label('Password')
        .validation({minlength: 6}),
      nga.field('repeatPassword', 'password')
        .label('Repeat Password')
        .validation({minlength: 6})
    ]);


  app.addEntity(user);

  nga.configure(app);
});


adminApp.run(($rootScope, $state, $location) => {
  const endsWith = function(s, suffix) {
    return s.indexOf(suffix, s.length - suffix.length) !== -1;
  };

  //This is a slight hack to correct https://github.com/marmelab/ng-admin/issues/423
  //It just removes the trailing slash when going to /entity/list/
  $rootScope.$watch(() => $location.absUrl(), (absUrl) => {
    if (endsWith(absUrl, '/list/')) {
      const path = $location.path();
      $location.path(path.substring(0, path.length-1));
    }
  });
});

adminApp.controller('Main', () => {});