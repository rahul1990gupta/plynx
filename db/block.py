import datetime
from db.db_object import DBObject
from utils.db_connector import *
from utils.common import to_object_id, ObjectId


class Block(DBObject):
    """
    Basic block with db interface
    """

    def __init__(self, block_id=None):
        super(Block, self).__init__()

        self._id = None
        self.title = None
        self.description = None
        self.base_block_name = None
        self.parent_block = None
        self.derived_from = None
        self.inputs = {}
        self.outputs = {}
        self.parameters = {}

        if block_id:
            self._id = to_object_id(block_id)
            self.load()
        else:
            self._id = ObjectId()

    def to_dict(self):
        return {
                "_id": self._id,
                "base_block_name": self.base_block_name,
                "inputs": self.inputs,
                "outputs": self.outputs,
                "parameters": self.parameters,
                "title": self.title,
                "description": self.description,
                "parent_block": self.parent_block,
                "derived_from": self.derived_from
            }

    def load_from_dict(self, d):
        for key, value in d:
            setattr(self, key, block[key])

    def save(self):
        if not self.is_dirty():
            return True

        now = datetime.datetime.utcnow()

        block_dict = self.to_dict()
        block_dict["update_date"] =  now

        db.blocks.find_one_and_update(
            {'_id': self._id},
            {
                "$setOnInsert": {"insertion_date": now},
                "$set": block_dict
            },
            upsert=True,
            )

        self._dirty = False
        return True

    def load(self, block=None):
        if not block:
            block = db.blocks.find_one({'_id': self._id})

        self.load_from_dict(block)

        self._dirty = False


if __name__ == "__main__":
    block = Block()
    block.title = 'Echo'
    block.base_block_name = "echo"
    block.outputs['out'] = ''
    block.description = 'echo'
    block.parameters['text'] = ''

    block.save()

    block = Block()
    block.title = 'Get Resource'
    block.base_block_name = "get_resource"
    block.outputs['out'] = ''
    block.description = 'get_resource'
    block.parameters['resource_id'] = ''

    block.save()

    block = Block()
    block.title = 'Grep'
    block.base_block_name = "grep"
    block.inputs['in'] = ''
    block.outputs['out'] = ''
    block.description = 'grep'
    block.parameters['resource_id'] = ''

    block.save()