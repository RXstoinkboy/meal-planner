/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.new_account.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/auth/controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/auth/controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/auth/controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/auth/controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/profile/controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/profile/controllers/profile_controller').default['show']>>>
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/auth/controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/auth/controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'recipes.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/recipes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['index']>>>
    }
  }
  'recipes.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/recipes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['show']>>>
    }
  }
  'recipes.store': {
    methods: ["POST"]
    pattern: '/api/v1/recipes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#features/recipes/validators/recipe').createRecipeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#features/recipes/validators/recipe').createRecipeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'recipes.update': {
    methods: ["PATCH"]
    pattern: '/api/v1/recipes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#features/recipes/validators/recipe').updateRecipeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#features/recipes/validators/recipe').updateRecipeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'recipes.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/recipes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/recipes/controllers/recipes_controller').default['destroy']>>>
    }
  }
}
