const Joi = require('joi');

module.exports = {

  pagingParams: ['page', 'perPage', 'sortField', 'sortDir'],

  pagingValidation: {
    page: Joi.number().integer().optional(),
    perPage: Joi.number().integer().optional(),
    sortField: Joi.string().optional(),
    sortDir: Joi.string().valid(['ASC', 'DESC']).optional()
  }

};