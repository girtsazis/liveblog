from superdesk.resource import Resource
from superdesk.services import BaseService
from .utils import generate_api_key


syndication_out_schema = {
    'blog_id': {
        'type': 'objectid',
        'required': True
    },
    'consumer_id': {
        'type': 'objectid',
        'required': True
    },
    'consumer_blog_id': {
        'type': 'objectid',
        'required': True
    },
    'last_delivered_post_id': {
        'type': 'objectid',
        'nullable': True
    },
    'token': {
        'type': 'string',
        'unique': True
    }
}


class SyndicationOutService(BaseService):
    notification_key = 'syndication_out'

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            if not doc.get('token'):
                doc['token'] = generate_api_key()


class SyndicationOut(Resource):
    datasource = {
        'source': 'syndication_out',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'syndication_out', 'PATCH': 'syndication_out', 'PUT': 'syndication_out',
                  'DELETE': 'syndication_out'}
    schema = syndication_out_schema


syndication_in_schema = {
    'blog_id': {
        'type': 'objectid',
        'required': True
    },
    'blog_token': {
        'type': 'string',
        'required': True,
        'unique': True
    },
    'producer_id': {
        'type': 'objectid',
        'required': True
    },
    'producer_blog_id': {
        'type': 'objectid',
        'required': True
    }
}


class SyndicationInService(BaseService):
    notification_key = 'syndication_in'


class SyndicationIn(Resource):
    datasource = {
        'source': 'syndication_in',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'syndication_in', 'PATCH': 'syndication_in', 'PUT': 'syndication_in',
                  'DELETE': 'syndication_in'}
    schema = syndication_in_schema
