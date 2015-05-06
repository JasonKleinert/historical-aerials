/* global angular:false */
const adminApp = angular.module('HistoricalAerialsAdmin', ['ng-admin', 'ConfigApp']);

adminApp.config(['RestangularProvider', (RestangularProvider) => {
  RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
    if (operation === 'getList') {
      params.page = params._page;
      params.perPage = params._perPage;
      if (params._sortDir) {
        params.sortDir = params._sortDir;
      }
      if (params._sortField) {
        params.sortField = params._sortField;
      }
      
      delete params._page;
      delete params._perPage;
      delete params._sortDir;
      delete params._sortField;
    }
    return { params: params };
  });
}]);

adminApp.config(['NgAdminConfigurationProvider', 'HOST', 'COUNTIES', (nga, HOST, COUNTIES) => {


  const app = nga.application('Historical Aerial Imagery Admin');
  app.baseApiUrl(HOST + '/admin/api/');

  const record = nga.entity('records');

  record.dashboardView()
    .title('Historical Aerial Imagery Records')
    .order(1)
    ;

  record.listView()
    .title('All Records')
    .description('All the historical aerial imagery records')
    .fields([
      nga.field('id').label('ID'),
      nga.field('AcquiringAgency').label('Acquiring Agency'),
      //TODO: this fires a request for each record, which is kinda goofy
      // might be better to manually manage the counties
      nga.field('CountyFIPS')
        .label('County')
        .map((val) => {
          return COUNTIES[val];
        }),
      nga.field('Date', 'date'),
      // nga.field('Coverage', 'boolean'),
      // nga.field('Created', 'datetime'),
      // nga.field('Modified', 'datetime'),
      // nga.field('Format'),
      nga.field('IndexType'),
      nga.field('IsPublic', 'boolean'),
      nga.field('LocationCode'),
      nga.field('Medium'),
      // nga.field('Mission'),
      // nga.field('NumFrames', 'number'),
      // nga.field('OrigDBNumber'),
      nga.field('PrintType'),
      nga.field('RSDIS'),
      nga.field('Remarks', 'text'),
      nga.field('Scale', 'number')
    ])
    .listActions(['show', 'edit', 'delete']);

  app.addEntity(record);

  nga.configure(app);
}]);

adminApp.controller('Main', () => {
});