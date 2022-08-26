#pragma once
#include <cstdint>
#include <LESSR/Types/Color3.h>

namespace LESSR
{
struct Color4
{
    uint8_t r;
    uint8_t g;
    uint8_t b;
    uint8_t a;

    Color4();
    Color4(uint8_t r, uint8_t g, uint8_t b, uint8_t a);
    Color4(const Color3& c);

    void set(uint8_t r, uint8_t g, uint8_t b, uint8_t a);
    void set(const Color3& c);
    void lerp(const Color4& v, float a, Color4* dst);
    Color4 lerp(const Color4& v, float a);

    bool operator==(const Color4& v) const;
    bool operator==(const Color3& v) const;

    Color4 operator*(const Color4& v) const;
    Color4& operator*=(const Color4& v);

    Color4 operator*(float f) const;
    Color4& operator*=(float f);
};

inline Color4::Color4() : r(0), g(0), b(0), a(255) {};
inline Color4::Color4(uint8_t r, uint8_t g, uint8_t b, uint8_t a) : r(r), g(g), b(b), a(a) {};
inline Color4::Color4(const Color3& c) : r(c.r), g(c.g), b(c.b), a(255) {};

inline void Color4::set(uint8_t _r, uint8_t _g, uint8_t _b, uint8_t _a)
{
    r = _r;
    g = _g;
    b = _b;
    a = _a;
}

inline void Color4::set(const Color3& c)
{
    r = c.r;
    g = c.g;
    b = c.b;
    a = 255;
}

inline bool Color4::operator==(const Color4& v) const
{
    return v.r == r && v.g == g && v.b == b && v.a == a;
}

inline bool Color4::operator==(const Color3& v) const
{
    return v.r == r && v.g == g && v.b == b && 255 == a;
}

inline Color4 Color4::operator*(const Color4& v) const
{
    return Color4(*this) *= v;
}

inline Color4& Color4::operator*=(const Color4& v)
{
    r *= v.r/255.f;
    g *= v.g/255.f;
    b *= v.b/255.f;
    a *= v.a/255.f;
    return *this;
}

inline Color4 Color4::operator*(float f) const
{
    return Color4(*this) *= f;
}

inline Color4& Color4::operator*=(float f)
{
    r *= f;
    g *= f;
    b *= f;
    a *= f;
    return *this;
}

}