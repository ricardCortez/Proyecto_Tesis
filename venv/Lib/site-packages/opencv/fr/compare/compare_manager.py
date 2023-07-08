from ..http_interactor import HttpInteractor
from ..compare.schemas import CompareRequest
from .. import util as util 

class CompareManager:
    """Class to help manage compare requests

    :param http_interactor: the http interactor instance
    :type http_interactor:HttpInteractor
    """

    def __init__(self, http_interactor:HttpInteractor) -> None:
        self.__http_interactor = http_interactor

    def compare_image_sets(self, compare_request:CompareRequest) -> float:
        """Compare two sets of images

        :param compare_request: the compare request to compare two sets of images
        :type compare_request:CompareRequest

        :return: score
        :rtype: float
        """
        post_body = compare_request.to_dict()

        gallery_b64_images = []
        for image in post_body["gallery"]:
            i_bytes = util.get_jpeg_bytes_from_pillow_img(image)
            i_str = util.get_base64_from_bytes(i_bytes)
            gallery_b64_images.append(i_str)

        probe_b64_images = []
        for image in post_body["probe"]:
            i_bytes = util.get_jpeg_bytes_from_pillow_img(image)
            i_str = util.get_base64_from_bytes(i_bytes)
            probe_b64_images.append(i_str)

        post_body["gallery"] = gallery_b64_images
        post_body["probe"] = probe_b64_images

        result = self.__http_interactor.post("compare", post_body, expected_status=200)
        score = int(round(result["score"] * 100, 2)) / 100
        return score
