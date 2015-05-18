/* global angular:false */
/* global _counties:false */
angular.module('ConfigApp', [])
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
  .constant('INDEX_TYPES', [
    {value: null, label: 'Not Specified'},
    {value: 'L', label: 'L'},
    {value: 'LM', label: 'LM'},
    {value: 'LP', label: 'LP'},
    {value: 'M', label: 'M'},
    {value: 'MP', label: 'MP'},
    {value: 'P', label: 'P'},
    {value: 'LMP', label: 'LMP'}
  ])
  ;