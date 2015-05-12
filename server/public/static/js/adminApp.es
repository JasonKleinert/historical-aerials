/* global angular:false */
const adminApp = angular.module('HistoricalAerialsAdmin', ['ng-admin', 'ConfigApp']);

adminApp.config((RestangularProvider) => {
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

adminApp.config((NgAdminConfigurationProvider, HOST, COUNTIES, MEDIUMS, PRINT_TYPES) => {
  const nga = NgAdminConfigurationProvider;

  const app = nga.application('TNRIS Historical Aerial Imagery Admin');
  app.baseApiUrl(HOST + '/admin/api/');

  const countyChoices = Object.keys(COUNTIES).map((k) => {
    return {value: parseInt(k, 10), label: COUNTIES[k]};
  });

  const record = nga.entity('records');

  record.dashboardView()
    .title('Historical Aerial Imagery Records')
    .order(1)
    ;

  record.listView()
    .title('Historical Aerial Imagery Records')
    .fields([
      nga.field('id').label('ID'),
      nga.field('AcquiringAgency').label('Acquiring Agency'),
      nga.field('CountyFIPS')
        .label('County')
        .map((val) => {
          return `${COUNTIES[val]}\n${val}`  || 'UNKOWN';
        }),
      nga.field('Date', 'date'),
      nga.field('IsPublic', 'boolean').label('Public'),
      nga.field('IndexType').label('Index Type'),
      nga.field('LocationCode').label('Location Code'),
      nga.field('Medium', 'choice')
        .choices(MEDIUMS),
      nga.field('PrintType', 'choice')
        .label('Print Type')
        .choices(PRINT_TYPES),
      nga.field('RSDIS', 'number'),
      nga.field('Scale', 'number')
    ])
    .filters([
      nga.field('CountyFIPS', 'choice')
        .label('County')
        .choices(countyChoices),
      nga.field('Year')
        .label('Min Year')
        .attributes({
          placeholder: 'Minimum Year',
          pattern: '(19|20)[0-9]{2,2}'
        }),
      nga.field('IsPublic', 'boolean')
        .label('Public Only')
    ])
    .listActions(['show', 'edit', 'delete']);

  record.showView()
    .fields([
      record.listView().fields(),
      nga.field('NumFrames', 'number').label('# of Frames'),
      nga.field('Created', 'datetime'),
      nga.field('Modified', 'datetime'),
      nga.field('Coverage', 'boolean'),
      nga.field('Format', 'number'),
      nga.field('Mission')
    ]);

  record.editionView()
    .title('Edit Record')
    .actions(['show', 'delete'])
    .fields([
      nga.field('id').label('ID').editable(false),
      nga.field('AcquiringAgency').label('Acquiring Agency'),
      nga.field('CountyFIPS', 'choice')
        .label('County')
        .choices(countyChoices),
      nga.field('Date', 'date'),
      nga.field('IsPublic', 'boolean').label('Public'),
      nga.field('IndexType').label('Index Type'),
      nga.field('LocationCode').label('Location Code'),
      nga.field('Medium', 'choice')
        .choices(MEDIUMS),
      nga.field('PrintType', 'choice')
        .label('Print Type')
        .choices(PRINT_TYPES),
      nga.field('NumFrames', 'number').label('# of Frames'),
      nga.field('Remarks', 'text'),
      nga.field('Scale', 'number'),
      nga.field('Coverage', 'boolean'),
      nga.field('Format', 'number'),
      nga.field('Mission'),
      nga.field('RSDIS', 'number'),
      nga.field('Created', 'datetime')
        .format('yyyy-MM-dd hh:mm:ss a')
        .editable(false),
      nga.field('Modified', 'datetime')
        .format('yyyy-MM-dd hh:mm:ss a')
        .editable(false)
    ]);

  // record.creationView();

  app.addEntity(record);

  nga.configure(app);
});

adminApp.controller('Main', () => {
});