#pragma once
#include <cstdint>

namespace LESSR
{
struct Color4;
struct Color3
{
    uint8_t r;
    uint8_t g;
    uint8_t b;

    Color3();
    Color3(uint8_t r, uint8_t g, uint8_t b);
    Color3(const Color4& c);

    void set(uint8_t r, uint8_t g, uint8_t b);
    void lerp(const Color3& v, float a, Color3* dst);
    Color3 lerp(const Color3& v, float a);

    bool operator==(const Color3& v) const;
};

inline Color3::Color3() : r(0), g(0), b(0) {};
inline Color3::Color3(uint8_t r, uint8_t g, uint8_t b) : r(r), g(g), b(b) {};

inline void Color3::set(uint8_t _r, uint8_t _g, uint8_t _b)
{
    r = _r;
    g = _g;
    b = _b;
}

inline bool Color3::operator==(const Color3& v) const
{
    return v.r == r && v.g == g && v.b == b;
}

}