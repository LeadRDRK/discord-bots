#include <LESSR/Base/Camera.h>
#include <LESSR/Base/MathUtils.h>

namespace LESSR
{

void Camera::initPerspective(float fieldOfView, uint32_t w, uint32_t h, float zNear, float zFar)
{
    type = CameraType::PERSPECTIVE;
    fov = fieldOfView;
    width = w;
    height = h;
    zNearPlane = zNear;
    zFarPlane = zFar;
    projUpdated = true;
}

void Camera::initOrthographic(uint32_t w, uint32_t h, float zNear, float zFar)
{
    type = CameraType::ORTHOGRAPHIC;
    width = w;
    height = h;
    zNearPlane = zNear;
    zFarPlane = zFar;
    projUpdated = true;
}

void Camera::setZPlanes(float zNear, float zFar)
{
    zNearPlane = zNear;
    zFarPlane = zFar;
    projUpdated = true;
}

void Camera::setViewportSize(uint32_t w, uint32_t h)
{
    width = w;
    height = h;
    projUpdated = true;
}

void Camera::setFOV(float f)
{
    fov = f;
    projUpdated = true;
}

void Camera::getZPlanes(float* zNear, float* zFar)
{
    *zNear = zNearPlane;
    *zFar = zFarPlane;
}

void Camera::getViewportSize(uint32_t* w, uint32_t* h)
{
    *w = width;
    *h = height;
}

float Camera::getFOV()
{
    return fov;
}

const Matrix4& Camera::getViewMatrix() const
{
    return viewMatrix;
}

const Matrix4& Camera::getProjectionMatrix() const
{
    return projMatrix;
}

const Matrix4& Camera::getViewProjectionMatrix() const
{
    return viewMatrix;
}

void Camera::updateViewMatrix()
{
    Matrix4 translation;
    Matrix4::createTranslation(-position, &translation);

    Matrix4 rotX; Matrix4::createRotationX(MATH_DEG_TO_RAD(-rotation.x), &rotX);
    Matrix4 rotY; Matrix4::createRotationY(MATH_DEG_TO_RAD(-rotation.y), &rotY);
    Matrix4 rotZ; Matrix4::createRotationZ(MATH_DEG_TO_RAD(-rotation.z), &rotZ);

    viewMatrix = rotZ * rotY * rotX * translation;
}

void Camera::updateProjMatrix()
{
    switch (type)
    {
    case CameraType::PERSPECTIVE:
        Matrix4::createPerspective(fov, (float)width / height, zNearPlane, zFarPlane, &projMatrix);
        break;

    case CameraType::ORTHOGRAPHIC:
        Matrix4::createOrthographic(width, height, zNearPlane, zFarPlane, &projMatrix);
        break;

    default:
        break;

    }
}

void Camera::update()
{
    if (modelUpdated || projUpdated)
    {
        if (modelUpdated)
        {
            updateViewMatrix();
            modelUpdated = false;
        }

        if (projUpdated)
        {
            updateProjMatrix();
            projUpdated = false;
        }

        vpMatrix = projMatrix * viewMatrix;
    }
}

}