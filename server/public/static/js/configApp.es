/* global angular:false */
/* global _counties:false */
angular.module('ConfigApp', [])
  .constant('HOST', '//localhost:3131')
  .constant('COUNTIES', _counties)
  .constant('MEDIUMS', [
    {value: "", label: "Not Specified"},
    {value: "BOARD", label: "Board"},
    {value: "FILM", label: "Film"},
    {value: "PAPER", label: "Paper"},
    {value: "PRINT", label: "Print"},
    {value: "TRANS", label: "Transparency"}
  ])
  .constant('PRINT_TYPES', [
    {value: 'B&W', label: 'Black & White'},
    {value: 'COL', label: 'Color'},
    {value: 'CIR', label: 'Color Infrared'}
  ])
  ;