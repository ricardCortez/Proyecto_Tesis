import enum
from typing import Optional, Union, List
import numpy as np
from PIL.Image import Image
from pathlib import Path
from .. import util as util 
from ..search.schemas import SearchMode


class CompareRequest:
    '''A compare request object
    
    :param gallery: a list of images (max 3), each being either a numpy array (obtained with cv2.imread),
        a string (path to a file), a Pillow image (obtained with PIL.Image.open()), or a pathlib path
    :type gallery: List[Union[numpy.ndarray, str, PIL.Image.Image, pathlib.Path]]
    :param probe: another list of images (like gallery)
    :type probe: List[Union[numpy.ndarray, str, PIL.Image.Image, pathlib.Path]]
    :param search_mode: the model to search FAST or ACCURATE, defaults to FAST
    :type search_mode: Optional[SearchMode]
    '''
    def __init__(self, 
                gallery: List[Union[np.ndarray, str, Image, Path]],
                probe: List[Union[np.ndarray, str, Image, Path]],  
                search_mode:Optional[SearchMode] = SearchMode.FAST) -> None:
        if not isinstance(gallery, list):
            raise TypeError("gallery must be a list")
        if not isinstance(probe, list):
            raise TypeError("probe must be a list")
        if len(gallery) > 3:
            raise ValueError("gallery must be a list of at most 3 images")
        if len(probe) > 3:
            raise ValueError("probe must be a list of at most 3 images")
        if len(gallery) == 0:
            raise ValueError("gallery must contain at least 1 image")
        if len(probe) == 0:
            raise ValueError("probe must contain at least 1 image")
        self.gallery = util.normalize_images(gallery)
        self.probe = util.normalize_images(probe)
        self.search_mode = search_mode

    def to_dict(self) -> dict:
        '''
        Return a dictionary representation of this object

        :return: a dictionary representing this object
        :rtype: dict
        '''
        repr = {
            "gallery": self.gallery,
            "probe": self.probe
        }

        if isinstance(self.search_mode, SearchMode):
            if self.search_mode == SearchMode.FAST:
                repr["search_mode"] = "FAST"
            else:
                repr["search_mode"] = "ACCURATE"
        else:
            repr["search_mode"] = self.search_mode

        return repr

    def __repr__(self) -> str:
        return str(self.to_dict())

    @property
    def search_mode(self):
        '''The model to use for a search'''
        return self._search_mode

    @search_mode.setter
    def search_mode(self, value):
        if not isinstance(value, SearchMode):
            raise TypeError("search_mode accepts only SearchMode.FAST or SearchMode.ACCURATE")
        self._search_mode = value

