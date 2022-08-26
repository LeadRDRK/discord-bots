#pragma once
#include <LESSR/Types/Matrix4.h>
#include <LESSR/Base/PRInstance.h>

namespace LESSR
{

enum class CameraType : char
{
    NONE,
    PERSPECTIVE,
    ORTHOGRAPHIC
};

class Camera : public PRInstance
{
public:
    void initPerspective(float fieldOfView, uint32_t width, uint32_t height, float zNearPlane, float zFarPlane);
    void initOrthographic(uint32_t width, uint32_t height, float zNearPlane, float zFarPlane);

    void setZPlanes(float zNearPlane, float zFarPlane);
    void setViewportSize(uint32_t width, uint32_t height);
    void setFOV(float fov);

    void getZPlanes(float* zNearPlane, float* zFarPlane);
    void getViewportSize(uint32_t* width, uint32_t* height);
    float getFOV();

    const Matrix4& getViewMatrix() const;
    const Matrix4& getProjectionMatrix() const;
    const Matrix4& getViewProjectionMatrix() const;

    void update();

private:
    void updateViewMatrix();
    void updateProjMatrix();

    CameraType type = CameraType::NONE;
    float zNearPlane, zFarPlane;
    uint32_t width, height;
    float fov;

    Matrix4 viewMatrix;
    Matrix4 projMatrix;
    Matrix4 vpMatrix;

    bool projUpdated = false;

};

}