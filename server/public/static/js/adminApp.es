/* global angular:false */
const adminApp = angular.module('HistoricalAerialsAdmin', ['ng-admin']);

adminApp.config(['NgAdminConfigurationProvider', (nga) => {

  const app = nga.application('Historical Aerials Admin');
  app.baseApiUrl('http://localhost:3131/admin/api/');

  const record = nga.entity('records');

  record.dashboardView()
    .title('Some Records')
    .order(1)
    .perPage(20)
    ;

  record.listView()
    .title('All Records')
    .description('All the historical aerial imagery records')
    .infinitePageination(true)
    ;
    
  app.addEntity(record);

  nga.configure(app);
}]);

adminApp.controller('Main', () => {
  console.log('here');
});