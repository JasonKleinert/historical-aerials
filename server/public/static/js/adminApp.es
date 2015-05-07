/* global angular:false */
const adminApp = angular.module('HistoricalAerialsAdmin', ['ng-admin', 'ConfigApp']);

adminApp.config(['RestangularProvider', (RestangularProvider) => {
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
}]);

adminApp.config(['NgAdminConfigurationProvider', 'HOST', 'COUNTIES', (nga, HOST, COUNTIES) => {

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
      //TODO: this fires a request for each record, which is kinda goofy
      // might be better to manually manage the counties
      nga.field('CountyFIPS')
        .label('County')
        .map((val) => {
          return `${COUNTIES[val]}\n${val}`  || 'UNKOWN';
        }),
      nga.field('Date', 'date'),
      nga.field('IndexType'),
      nga.field('IsPublic', 'boolean'),
      nga.field('LocationCode'),
      nga.field('Medium'),
      nga.field('PrintType', 'choice')
        .choices([
          {value: 'B&W', label: 'Black & White'},
          {value: 'COL', label: 'Color'},
          {value: 'CIR', label: 'Color Infrared'}
        ]),
      nga.field('RSDIS'),
      nga.field('Remarks', 'text'),
      nga.field('Scale', 'number')
    ])
    .filters([
      nga.field('CountyFIPS', 'choice')
        .label('County')
        .choices(countyChoices),
      nga.field('IsPublic', 'boolean')
    ])
    .listActions(['show', 'edit', 'delete']);

  record.showView()
    .fields([
      record.listView().fields(),
      nga.field('NumFrames', 'number'),
      nga.field('Created', 'datetime'),
      nga.field('Modified', 'datetime'),
      nga.field('Coverage', 'boolean'),
      nga.field('Format'),
      nga.field('Mission')
    ]);

  // record.creationView();
  // record.editionView()
  //   .fields([
  //   ]);


  app.addEntity(record);

  nga.configure(app);
}]);

adminApp.controller('Main', () => {
});