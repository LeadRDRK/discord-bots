#pragma once

namespace LESSR
{
struct TexCoord
{
    float u = 0;
    float v = 0;

    TexCoord();
    TexCoord(float u, float v);
    void zero();

    void lerp(const TexCoord& t, float a, TexCoord* dst);
    TexCoord lerp(const TexCoord& t, float a);

    TexCoord operator+(const TexCoord& t) const;
    TexCoord operator-(const TexCoord& t) const;
    TexCoord operator*(const TexCoord& t) const;
    TexCoord operator/(const TexCoord& t) const;
    TexCoord& operator+=(const TexCoord& t);
    TexCoord& operator-=(const TexCoord& t);
    TexCoord& operator*=(const TexCoord& t);
    TexCoord& operator/=(const TexCoord& t);

    TexCoord operator*(float f) const;
    TexCoord operator/(float f) const;
    TexCoord& operator*=(float f);
    TexCoord& operator/=(float f);

    bool operator==(const TexCoord& v) const;

    TexCoord operator-();
};

inline TexCoord::TexCoord() : u(0.f), v(0.f) {};
inline TexCoord::TexCoord(float u, float v) : u(u), v(v) {};

inline void TexCoord::zero()
{
    u = 0;
    v = 0;
}

inline TexCoord TexCoord::operator+(const TexCoord& t) const
{
    return TexCoord(u + t.u, v + t.v);
}

inline TexCoord TexCoord::operator-(const TexCoord& t) const
{
    return TexCoord(u - t.u, v - t.v);
}

inline TexCoord TexCoord::operator*(const TexCoord& t) const
{
    return TexCoord(u * t.u, v * t.v);
}

inline TexCoord TexCoord::operator/(const TexCoord& t) const
{
    return TexCoord(u / t.u, v / t.v);
}

inline TexCoord& TexCoord::operator+=(const TexCoord& t)
{
    u += t.u;
    v += t.v;
    return *this;
}

inline TexCoord& TexCoord::operator-=(const TexCoord& t)
{
    u -= t.u;
    v -= t.v;
    return *this;
}

inline TexCoord& TexCoord::operator*=(const TexCoord& t)
{
    u *= t.u;
    v *= t.v;
    return *this;
}

inline TexCoord& TexCoord::operator/=(const TexCoord& t)
{
    u /= t.u;
    v /= t.v;
    return *this;
}

inline TexCoord TexCoord::operator*(float f) const
{
    return TexCoord(u * f, v * f);
}

inline TexCoord TexCoord::operator/(float f) const
{
    return TexCoord(u / f, v / f);
}

inline TexCoord& TexCoord::operator*=(float f)
{
    u *= f;
    v *= f;
    return *this;
}

inline TexCoord& TexCoord::operator/=(float f)
{
    u /= f;
    v /= f;
    return *this;
}

inline bool TexCoord::operator==(const TexCoord& t) const
{
    return t.u == u && t.v == v;
}

inline TexCoord TexCoord::operator-()
{
    return TexCoord(-u, -v);
}

}