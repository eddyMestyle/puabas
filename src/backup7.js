import React, { useState, useEffect } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { Box, Button, Card, CardActions, CardContent, Typography, CircularProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const colors = {
  primary: '#15023F',
  secondary: '#680404',
  white: '#FFFFFF',
  black: '#000000',
};

const NeumorphicBox = styled(Paper)(({ theme }) => ({
  background: colors.white,
  borderRadius: '20px',
  boxShadow: `8px 8px 16px ${colors.black}20, -8px -8px 16px ${colors.white}`,
  padding: '20px',
  textAlign: 'center',
}));

const proxyUrl = 'https://6a46-49-49-62-225.ngrok-free.app'; // CORS Proxy URL

const getRandomScore = () => {
  const totalWeight = 911111010;
  const randomInt = Math.floor(Math.random() * totalWeight) + 1;

  if (randomInt <= 10) {
    return Math.floor(Math.random() * (10000 - 5001 + 1)) + 5001;
  } else if (randomInt <= 1010) {
    return Math.floor(Math.random() * (4999 - 3001 + 1)) + 3001;
  } else if (randomInt <= 11010) {
    return Math.floor(Math.random() * (3000 - 1001 + 1)) + 1001;
  } else if (randomInt <= 111010) {
    return Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
  } else if (randomInt <= 1111010) {
    return Math.floor(Math.random() * (499 - 300 + 1)) + 300;
  } else if (randomInt <= 11111110) {
    return Math.floor(Math.random() * (299 - 100 + 1)) + 100;
  } else if (randomInt <= 61111110) {
    return Math.floor(Math.random() * (99 - 50 + 1)) + 50;
  } else if (randomInt <= 211111110) {
    return Math.floor(Math.random() * (49 - 21 + 1)) + 21;
  } else {
    return Math.floor(Math.random() * (20 - 1 + 1)) + 1;
  }
};

const App = () => {
  const [score, setScore] = useState(null);
  const [remainingChances, setRemainingChances] = useState(0); // เริ่มต้นด้วย 0 เพื่อรอดึงข้อมูล
  const [totalBonus, setTotalBonus] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true); // สถานะการโหลด

  // ฟังก์ชันการบันทึก User Profile ลงใน Directus
  const storeUserProfile = async (profile) => {
    try {
      await axios.post(`${proxyUrl}/items/user`, {
        line_user_id: profile.userId,
        display_name: profile.displayName,
        email: profile.email || '',
        profile_picture_url: profile.pictureUrl,
        random_draws_available: 5, // ค่าเริ่มต้น
        total_bonus: 0, // ค่าเริ่มต้น
      });
      console.log('User profile stored successfully');
    } catch (err) {
      console.error('Error storing user profile:', err);
      setError('Error storing user profile');
    }
  };

  // ฟังก์ชันการดึงข้อมูลสิทธิ์การสุ่มของผู้ใช้จากฐานข้อมูล
  const fetchRemainingDraws = async (lineUserId) => {
    try {
      const response = await axios.get(`${proxyUrl}/items/user/${lineUserId}`);
      setRemainingChances(response.data.remaining_draws); // จำนวนสิทธิ์การสุ่มที่เหลือ
      setTotalBonus(response.data.total_bonus); // คะแนนรวมที่สามารถขอรับโบนัสได้
      setIsLoading(false); // ปิดสถานะการโหลดเมื่อดึงข้อมูลเสร็จ
    } catch (err) {
      console.error('Error fetching draw status:', err);
      setError('Error fetching draw status');
      setIsLoading(false); // ปิดสถานะการโหลดหากเกิดข้อผิดพลาด
    }
  };

  // ฟังก์ชันตรวจสอบว่ามี User ในฐานข้อมูลหรือไม่
  const checkUserExists = async (lineUserId) => {
    try {
      const response = await axios.get(`${proxyUrl}/items/user/${lineUserId}`);
      if (response.data.remaining_draws !== undefined) {
        // ถ้ามีผู้ใช้แล้ว ดึงสิทธิ์การสุ่มมาแสดง
        await fetchRemainingDraws(lineUserId);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  // ฟังก์ชันสุ่มคะแนน
  const handleRandomize = async () => {
    if (!userProfile) {
      alert('กรุณาเข้าสู่ระบบก่อนทำการสุ่มคะแนน');
      return;
    }

    if (remainingChances > 0 && !isAnimating) {
      setIsAnimating(true);

      let animationTime = 0;
      const animationDuration = 2000;
      const animationInterval = 100;

      const animation = setInterval(() => {
        const digits = Math.floor(Math.random() * 5) + 1;
        let min = digits === 1 ? 0 : Math.pow(10, digits - 1);
        let max = Math.pow(10, digits) - 1;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        setScore(randomNumber);

        animationTime += animationInterval;

        if (animationTime >= animationDuration) {
          clearInterval(animation);
          finishRandomize();
        }
      }, animationInterval);
    } else if (remainingChances === 0) {
      alert('คุณใช้สิทธิ์ในการสุ่มหมดแล้ว!');
    }
  };

  const finishRandomize = async () => {
    const newScore = getRandomScore();
    setScore(newScore);
    setIsAnimating(false);
    setRemainingChances((prev) => prev - 1);
    setTotalBonus((prev) => prev + newScore);

    try {
      await axios.patch(`${proxyUrl}/items/user/${userProfile.userId}`, {
        random_draws_available: remainingChances - 1,
      });

      await axios.post(`${proxyUrl}/items/score`, {
        line_user_id: userProfile.userId,
        score_value: newScore,
        redemption_status: 'pending',
      });

      const bonusResponse = await axios.get(`${proxyUrl}/items/score`, {
        params: {
          filter: {
            line_user_id: { _eq: userProfile.userId },
            redemption_status: { _eq: 'pending' },
          },
        },
      });

      const pendingScores = bonusResponse.data.data;
      const totalPendingBonus = pendingScores.reduce((sum, score) => sum + score.score_value, 0);
      setTotalBonus(totalPendingBonus);

    } catch (err) {
      console.error('Error updating data:', err);
    }

    try {
      await liff.sendMessages([{ type: 'text', text: `คุณได้รับโบนัสคะแนน: ${newScore} Points` }]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleClaimBonus = async () => {
    alert(`คุณได้รับโบนัสทั้งหมด ${totalBonus} Points`);
    try {
      await axios.patch(`${proxyUrl}/items/user/bonus/${userProfile.userId}`, {
        total_bonus: 0,
      });
    } catch (err) {
      console.error('Error updating bonus:', err);
    }
    setTotalBonus(0);
  };

  const handleAddChances = () => {
    liff.openWindow({
      url: 'https://shop.line.me/@670swsmq/collection/215829',
      external: true,
    });
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await liff.getProfile();
      setUserProfile(profile);
      const userExists = await checkUserExists(profile.userId);
      if (!userExists) {
        await storeUserProfile(profile);
        await fetchRemainingDraws(profile.userId);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Unable to fetch your profile');
    }
  };

  useEffect(() => {
    const initializeLiff = async () => {
      setIsLoading(true);
      try {
        await liff.init({ liffId: '2006313023-25YJYLoe', withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          fetchUserProfile();
        }
      } catch (err) {
        console.error('LIFF Initialization failed', err);
        setError('LIFF initialization failed');
        setIsLoading(false);
      }
    };
    initializeLiff();
  }, []);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', paddingX: '16px', backgroundColor: colors.white }}>
      <Card sx={{ backgroundColor: colors.white, borderRadius: '30px', boxShadow: `20px 20px 60px ${colors.black}20, -20px -20px 60px ${colors.white}`, padding: '30px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} color="inherit" />
            <Typography sx={{ fontSize: '18px', color: colors.primary }}>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
          <>
            <NeumorphicBox sx={{ marginBottom: '30px' }}>
              {score !== null ? (
                <Box>
                  <Typography sx={{ fontSize: isAnimating ? '64px' : '72px', fontWeight: 'bold', color: colors.primary }}>{score}</Typography>
                  {!isAnimating && <Typography sx={{ fontSize: '24px', fontWeight: 'medium', color: colors.secondary }}>Points</Typography>}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>กดปุ่มเพื่อสุ่มคะแนน</Typography>
              )}
            </NeumorphicBox>
            <CardContent>
              <Typography sx={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: colors.black }}>จำนวนสิทธิ์ในการสุ่มรับโบนัส: {remainingChances}</Typography>
              <Typography sx={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: colors.black }}>คะแนนรวมที่สามารถขอรับโบนัสได้: {totalBonus} Points</Typography>
            </CardContent>
            <CardActions sx={{ display: 'flex', justifyContent: 'center', gap: '20px', flexDirection: 'column' }}>
              <Button onClick={handleRandomize} disabled={remainingChances === 0 || isAnimating} variant="contained" sx={{ borderRadius: '50px', padding: '15px 20px', width: '100%', backgroundColor: colors.primary, color: colors.white, boxShadow: `6px 6px 12px ${colors.black}20, -6px -6px 12px ${colors.white}`, '&:hover': { backgroundColor: colors.primary } }}>
                {isAnimating ? <CircularProgress size={24} color="inherit" /> : 'สุ่มคะแนน'}
              </Button>
              <Button onClick={handleClaimBonus} disabled={totalBonus === 0} variant="contained" sx={{ borderRadius: '50px', padding: '15px 20px', width: '100%', backgroundColor: colors.secondary, color: colors.white, boxShadow: `6px 6px 12px ${colors.black}20, -6px -6px 12px ${colors.white}`, '&:hover': { backgroundColor: colors.secondary } }}>ขอรับโบนัส</Button>
              <Button onClick={handleAddChances} variant="outlined" sx={{ borderRadius: '50px', padding: '15px 20px', width: '100%', borderColor: colors.primary, color: colors.primary, boxShadow: `6px 6px 12px ${colors.black}20, -6px -6px 12px ${colors.white}`, '&:hover': { backgroundColor: colors.white } }}>เพิ่มสิทธิ์ในการสุ่ม</Button>
            </CardActions>
          </>
        )}
      </Card>
    </Box>
  );
};

export default App;




//////  สามารถดึงสิทธิ์ได้ และ บันทึก User ได้แล้ว  //////