import React, { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { Box, Button, Card, CardActions, CardContent, Typography, CircularProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// กำหนดสีตาม YMCK
const colors = {
  primary: '#15023F',
  secondary: '#680404',
  white: '#FFFFFF',
  black: '#000000',
};

// สไตล์สำหรับ NeumorphicBox
const NeumorphicBox = styled(Paper)(({ theme }) => ({
  background: colors.white,
  borderRadius: '20px',
  boxShadow: `8px 8px 16px ${colors.black}20, -8px -8px 16px ${colors.white}`,
  padding: '20px',
  textAlign: 'center',
}));

const App = () => {
  const [score, setScore] = useState(null);
  const [remainingChances, setRemainingChances] = useState(0); // เริ่มต้นที่ 0 และดึงจาก Database
  const [totalBonus, setTotalBonus] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState('');

  const proxyUrl = 'https://13f6-49-49-62-225.ngrok-free.app'; // URL ของ CORS Proxy

  // ฟังก์ชันในการดึงข้อมูลสิทธิ์การสุ่มและโบนัสจากฐานข้อมูล Directus
  const fetchUserData = async (lineUserId) => {
    try {
      const response = await axios.get(`${proxyUrl}/items/user/${lineUserId}`);
      const userData = response.data;
      setRemainingChances(userData.remaining_draws);
      setTotalBonus(userData.total_bonus);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Unable to fetch user data');
    }
  };

  // ฟังก์ชันการบันทึกโปรไฟล์ผู้ใช้
  const storeUserProfile = async (profile) => {
    try {
      await axios.post(`${proxyUrl}/items/user`, profile);
    } catch (err) {
      console.error('Error storing user profile:', err);
    }
  };

  // ฟังก์ชันการเรียกใช้ LIFF และดึงข้อมูลผู้ใช้
  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await liff.getProfile();
      setUserProfile(profile);

      // ดึงข้อมูลจาก Directus ผ่าน proxy CORS
      await fetchUserData(profile.userId);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Unable to fetch user profile');
    }
  }, []);

  // ฟังก์ชันการสุ่มคะแนน
  const handleRandomize = async () => {
    if (remainingChances > 0 && !isAnimating) {
      setIsAnimating(true);

      const randomScore = Math.floor(Math.random() * 100); // ตัวอย่างการสุ่มคะแนน
      setScore(randomScore);
      setTotalBonus((prev) => prev + randomScore);
      setRemainingChances((prev) => prev - 1);

      // อัปเดตจำนวนสิทธิ์การสุ่มและบันทึกคะแนนลงในฐานข้อมูล
      try {
        await axios.patch(`${proxyUrl}/items/user/${userProfile.userId}`, { remaining_draws: remainingChances - 1 });
        await axios.post(`${proxyUrl}/items/score`, {
          user_id: userProfile.userId,
          score_value: randomScore,
          redemption_status: 'pending',
        });
      } catch (err) {
        console.error('Error updating remaining chances or storing score:', err);
      }

      setIsAnimating(false);
    } else {
      alert('คุณใช้สิทธิ์ในการสุ่มหมดแล้ว!');
    }
  };

  // LIFF Initialization
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: '2006313023-25YJYLoe', withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          fetchUserProfile();
        }
      } catch (err) {
        console.error('LIFF Initialization failed:', err);
        setError('LIFF initialization failed');
      }
    };
    initializeLiff();
  }, [fetchUserProfile]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', paddingX: '16px', backgroundColor: colors.white }}>
      <Card sx={{ backgroundColor: colors.white, borderRadius: '30px', boxShadow: `20px 20px 60px ${colors.black}20, -20px -20px 60px ${colors.white}`, padding: '30px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
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
          <Typography sx={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: colors.black }}>จำนวนสิทธิ์ในการสุ่ม: {remainingChances}</Typography>
          <Typography sx={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: colors.black }}>คะแนนรวมที่สามารถขอรับโบนัสได้: {totalBonus} Points</Typography>
        </CardContent>
        <CardActions sx={{ display: 'flex', justifyContent: 'center', gap: '20px', flexDirection: 'column' }}>
          <Button onClick={handleRandomize} disabled={remainingChances === 0 || isAnimating} variant="contained" sx={{ borderRadius: '50px', padding: '15px 20px', width: '100%', backgroundColor: colors.primary, color: colors.white, boxShadow: `6px 6px 12px ${colors.black}20, -6px -6px 12px ${colors.white}`, '&:hover': { backgroundColor: colors.primary } }}>
            {isAnimating ? <CircularProgress size={24} color="inherit" /> : 'สุ่มคะแนน'}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default App;
