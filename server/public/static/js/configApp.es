/* global angular:false */
/* global _counties:false */
angular.module('ConfigApp', [])
  .constant('HOST', '//localhost:3131')
  .constant('COUNTIES', _counties)
  ;