#pragma once
#include <LESSR/Types/Vector3.h>

namespace LESSR
{

class PRInstance
{
public:
    virtual void setPosition(const Vector3& pos);
    virtual void setRotation(const Vector3& rotation);

    const Vector3& getPosition() const;
    const Vector3& getRotation() const;

protected:
    Vector3 position;
    Vector3 rotation;

    bool modelUpdated = true;
    
};

inline void PRInstance::setPosition(const Vector3 &pos)
{
    position = pos;
    modelUpdated = true;
}

inline void PRInstance::setRotation(const Vector3 &r)
{
    rotation = r;
    modelUpdated = true;
}

inline const Vector3& PRInstance::getPosition() const { return position; }
inline const Vector3& PRInstance::getRotation() const { return rotation; }

}