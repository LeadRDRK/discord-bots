#pragma once
#include <LESSR/Types/Vector3.h>
#include <LESSR/Types/Color3.h>
#include <LESSR/Types/Color4.h>
#include <LESSR/Types/TexCoord.h>
#include <LESSR/Types/ImageData.h>
#include <LESSR/Types/Matrix4.h>
#include <LESSR/Base/Object.h>
#include <LESSR/Base/PRInstance.h>
#include <vector>

namespace LESSR
{

class Node : public Object, PRInstance
{
public:
    void setScale(const Vector3& scale);
    void setAnchorPoint(const Vector3& anchor);
    void setColor(const Color3& color);
    void setColor(const Color4& color);
    void setOpacity(uint8_t opacity);
    void setVisible(bool visible);
    void setTransformMatrix(const Matrix4& transform);

    const Vector3& getScale() const;
    const Vector3& getAnchorPoint() const;
    const Color4& getColor() const;
    uint8_t getOpacity() const;
    bool isVisible() const;
    const Matrix4& getTransformMatrix() const;

    virtual void update();

private:
    Vector3 position;
    Vector3 scale = Vector3(1, 1, 1);
    Vector3 anchorPoint = Vector3(0.5, 0.5, 0.5);
    Vector3 rotation;
    Color4 color;
    bool visible = true;

    Matrix4 transform;
    Matrix4 modelMatrix;
    
};

inline const Vector3& Node::getScale() const       { return scale; }
inline const Vector3& Node::getAnchorPoint() const { return anchorPoint; }
inline const Color4&  Node::getColor() const       { return color; }
inline uint8_t        Node::getOpacity() const     { return color.a; }
inline bool           Node::isVisible() const      { return visible; }
inline const Matrix4& Node::getTransformMatrix() const { return transform; }

}