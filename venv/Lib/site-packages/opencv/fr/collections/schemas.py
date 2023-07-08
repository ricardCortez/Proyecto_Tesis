from datetime import datetime
from typing import List
from dateutil.parser import parse

class CollectionBase:
    '''A minimal collection object for creation

    :param name: the name of the collection
    :type name:str
    :param description: the description of the collection
    :type description: str
    '''
    def __init__(self, name: str, description: str = None) -> None:
        self.name = name
        self._description: str = description

    @property
    def name(self):
        '''Name of the collection'''
        return self._name

    @name.setter
    def name(self, value):
        if not isinstance(value, str):
            raise TypeError("name accepts only str")
        if not isinstance(value, str) or len(value) == 0:
            raise ValueError("name must be a non-empty string")
        self._name = value

    @property
    def description(self):
        '''Description of the collection'''
        return self._description

    @description.setter
    def description(self, value):
        if not isinstance(value, str) and value is not None:
            raise TypeError("description must be a string or None")
        self._description = value

    def to_dict(self) -> dict:
        '''
        Return a dictionary representation of this object

        :return: a dictionary representing this object
        :rtype: dict
        '''
        return {
            "name": self.name,
            "description": self.description
        }

    def __repr__(self) -> str:
        return str(self.to_dict())

class Collection(CollectionBase):
    '''A previously created collection object

    :param id: the id of a previously created collection
    :type id:str
    :param name: the name of the collection
    :type name:str
    :param description: the description of the collection
    :type description: str
    :param count: the number of persons in this collection
    :type count: int
    :param create_date: date that this collection was created
    :type create_date: datetime
    :param modified_date: date that this collection was modified
    :type modified_date: datetime
    '''
    def __init__(self, id: str, name: str, description: str, count: int,
                 create_date: datetime, modified_date: datetime) -> None:
        super().__init__(name, description)

        if not isinstance(id, str):
            raise TypeError("id must be non-empty string")
        if len(id) == 0:
            raise ValueError("id must be a non-empty string")

        if not isinstance(count, int):
            raise TypeError("count must be an int")

        if not isinstance(create_date, datetime):
            raise TypeError("create_date must be a datetime")

        if not isinstance(modified_date, datetime):
            raise TypeError("modified_date must be a datetime")

        self._id: str = id
        self._count = count
        self._create_date = create_date
        self._modified_date = modified_date

    @property
    def count(self):
        '''The number of persons in this collection'''
        return self._count

    @property
    def id(self):
        '''The id of this collection'''
        return self._id

    @property
    def create_date(self):
        '''The date this collection was created'''
        return self._create_date

    @property
    def modified_date(self):
        '''The date this collection was modified'''
        return self._modified_date

    @classmethod
    def from_dict(cls, obj:dict):
        """Get a collection initialized from a dict

        :param obj: the dictionary representing this object
        :type obj:dict

        :return: a Collection object
        :rtype: Collection
        """
        return Collection(obj["id"], obj["name"], obj["description"], obj["count"],
            parse(obj["create_date"]), parse(obj["modified_date"]))

    def to_dict(self) -> dict:
        '''
        Return a dictionary representation of this object

        :return: a dictionary representing this object
        :rtype: dict
        '''
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "count": self.count,
            "create_date": str(self.create_date),
            "modified_date": str(self.modified_date)
        }

    def __repr__(self) -> str:
        return str(self.to_dict())

class CollectionList:
    '''A list of collections

    :param count: the total count of all collections in the database
    :type count:int
    :param collections: the collections matching the criteria
    :type collections:List[Collection]
    '''
    
    def __init__(self, count: int, collections: List[Collection]) -> None:
        if not isinstance(count, int):
            raise TypeError("count must be an int")

        if not isinstance(collections, list):
            raise TypeError("collections must be a list")

        for collection in collections:
            if not isinstance(collection, Collection):
                raise TypeError("At least one item in collections is not an object of type Collection")

        self._count: int = count
        self._collections: List[Collection] = collections

    @property
    def count(self):
        '''The total number of collections in the database that match the criteria'''
        return self._count

    @property
    def collections(self):
        '''The (paged) collections matching the criteria'''
        return self._collections

    @classmethod
    def from_dict(cls, obj:dict):
        """Get a collection list initialized from a dict

        :param obj: the dictionary representing this object
        :type obj:dict

        :return: a CollectionList object
        :rtype: CollectionList
        """
        collections = [Collection.from_dict(item) for item in obj["collections"]]
        return CollectionList(obj["count"], collections)

    def to_dict(self) -> dict:
        '''
        Return a dictionary representation of this object

        :return: a dictionary representing this object
        :rtype: dict
        '''
        return {
            "count": self.count,
            "collections": [item.to_dict() for item in self.collections],
        }

    def __repr__(self) -> str:
        return str(self.to_dict())


