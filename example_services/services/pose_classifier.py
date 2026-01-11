"""Auto-generated service: pose_classifier"""


from generated.pose_classifier_pb2 import ClassificationRequest, ClassificationResponse

from aip_service_kit import App
app = App()


@app.route("classify-pose")
def classify_pose(request: ClassificationRequest) -> ClassificationResponse:
    """
    Handler for classify_pose service.
    """
    print(f"[classify_pose] Received request: {request}")
    
    # TODO: Implement service logic
    response = ClassificationResponse()
    
    return response



if __name__ == "__main__":
    app.run(protocol="http", port=8082)
