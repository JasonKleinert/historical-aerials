const Joi = require('joi');

module.exports = {

  pagingParams: ['page', 'perPage', 'sortField', 'sortDir'],

  pagingValidation: {
    page: Joi.number().integer().optional(),
    perPage: Joi.number().integer().optional(),
    sortField: Joi.string().optional(),
    sortDir: Joi.string().valid(['ASC', 'DESC']).optional()
  },

  //Joi doesn't allow empty strings even as optional
  // so have to use allow('') on them ref: https://github.com/hapijs/joi/issues/482
  creationValidation: {
    AcquiringAgency: Joi.string().required(),
    CountyFIPS: Joi.number().integer().required(),
    Date: Joi.date().optional(),
    IsPublic: Joi.boolean().required(),
    IndexType: Joi.string().allow('').allow(null).optional(),
    LocationCode: Joi.string().allow('').allow(null).optional(),
    Medium: Joi.string().required(),
    PrintType: Joi.string().required(),
    NumFrames: Joi.number().integer().allow(null).optional(),
    Remarks: Joi.string().allow('').allow(null).optional(),
    Scale: Joi.number().allow(null).optional(),
    Coverage: Joi.boolean().required(),
    Format: Joi.number().integer().allow(null).optional(),
    Mission: Joi.string().allow('').allow(null).optional(),
    RSDIS: Joi.number().integer().allow(null).optional()
  }

};