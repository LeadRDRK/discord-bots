#include <LESSR/Base/Node.h>
#include <LESSR/Base/MathUtils.h>
#include <cstring>

namespace LESSR
{

void Node::setScale(const Vector3 &s)
{
    scale = s;
    modelUpdated = true;
}

void Node::setAnchorPoint(const Vector3 &anchor)
{
    anchorPoint = anchor;
    modelUpdated = true;
}

void Node::setColor(const Color3& c)
{
    color = c;
}

void Node::setColor(const Color4& c)
{
    color = c;
}

void Node::setOpacity(uint8_t opacity)
{
    color.a = opacity;
}

void Node::setVisible(bool v)
{
    visible = v;
}

void Node::setTransformMatrix(const Matrix4 &t)
{
    transform = t;
    modelUpdated = true;
}

void Node::update()
{
    if (modelUpdated)
    {
        Matrix4 scaleMat;
        Matrix4::createScale(scale, &scaleMat);

        Matrix4 pTranslation; // point translation (translate origin -> anchor)
        Matrix4::createTranslation(anchorPoint, &pTranslation);

        Matrix4 rotX; Matrix4::createRotationX(MATH_DEG_TO_RAD(rotation.x), &rotX);
        Matrix4 rotY; Matrix4::createRotationY(MATH_DEG_TO_RAD(rotation.y), &rotY);
        Matrix4 rotZ; Matrix4::createRotationZ(MATH_DEG_TO_RAD(rotation.z), &rotZ);

        Matrix4 oTranslation;  // object translation (translate anchor -> object)
        Matrix4::createTranslation(position, &oTranslation);

        modelMatrix = transform * oTranslation * rotZ * rotY * rotX * pTranslation * scaleMat;
    }
}

}