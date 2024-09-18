import React, { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { Box, Button, Card, CardActions, CardContent, Typography, CircularProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// กำหนดสีตาม YMCK
const colors = {
  primary: '#15023F',     // Y
  secondary: '#680404',   // M
  white: '#FFFFFF',       // C
  black: '#000000',       // K
};

// สไตล์สำหรับ NeumorphicBox
const NeumorphicBox = styled(Paper)(({ theme }) => ({
  background: colors.white,
  borderRadius: '20px',
  boxShadow: `8px 8px 16px ${colors.black}20, -8px -8px 16px ${colors.white}`,
  padding: '20px',
  textAlign: 'center',
}));

// ฟังก์ชันในการสร้าง UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = (c === 'x') ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

// ฟังก์ชันการสุ่มคะแนน
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
  const [remainingChances, setRemainingChances] = useState(5);
  const [totalBonus, setTotalBonus] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState('');

  // ฟังก์ชันในการบันทึกโปรไฟล์ของผู้ใช้ผ่าน Proxy
  const storeUserProfileInDirectus = async (profile) => {
    try {
      const response = await axios.get('https://13f6-49-49-62-225.ngrok-free.app/items/user', {
        params: {
          filter: { line_user_id: { _eq: profile.userId } }
        }
      });

      if (response.data.data.length === 0) {
        const newUserId = generateUUID();

        await axios.post('https://13f6-49-49-62-225.ngrok-free.app/items/user', {
          user_id: newUserId,
          line_user_id: profile.userId,
          display_name: profile.displayName,
          profile_picture_url: profile.pictureUrl,
          email: profile.email,
          random_draws_available: 5,
        });
      }
    } catch (err) {
      console.error('Error storing user profile:', err);
      setError('Error storing user profile');
    }
  };

  // ฟังก์ชันดึงโปรไฟล์ผู้ใช้จาก LIFF
  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await liff.getProfile();
      const idToken = liff.getDecodedIDToken();
      const email = idToken ? idToken.email : 'no email';
      setUserProfile({ ...profile, email });
      await storeUserProfileInDirectus({ ...profile, email });

      const userResponse = await axios.get('https://13f6-49-49-62-225.ngrok-free.app/items/user', {
        params: { filter: { line_user_id: { _eq: profile.userId } } }
      });

      if (userResponse.data.data.length > 0) {
        const userData = userResponse.data.data[0];
        if (userData.random_draws_available !== undefined) {
          setRemainingChances(userData.random_draws_available);
        } else {
          console.error('random_draws_available is undefined');
          setRemainingChances(0);  // ตั้งค่าเริ่มต้นให้เป็น 0 ถ้าไม่มีข้อมูล
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Unable to fetch your profile');
    }
  }, []);

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
        console.error('LIFF Initialization failed', err);
        setError('LIFF initialization failed');
      }
    };
    initializeLiff();
  }, [fetchUserProfile]);

  // ฟังก์ชันการสุ่มคะแนน
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
      // บันทึกสิทธิ์การสุ่มที่เหลือในฐานข้อมูล
      if (remainingChances !== null && remainingChances !== undefined) {
        await axios.patch('https://13f6-49-49-62-225.ngrok-free.app/items/user', 
        {
          random_draws_available: remainingChances - 1,
        }, {
          params: {
            filter: { line_user_id: { _eq: userProfile.userId } },
          },
        });
      } else {
        console.error('remainingChances is undefined or null');
      }
    } catch (err) {
      console.error('Error updating remaining chances:', err);
    }

    try {
      await storeScoreInDirectus(newScore);
    } catch (err) {
      console.error('Error storing score:', err);
    }

    try {
      await liff.sendMessages([{ type: 'text', text: `คุณได้รับโบนัสคะแนน: ${newScore} Points` }]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const storeScoreInDirectus = async (scoreValue) => {
    try {
      await axios.post('https://13f6-49-49-62-225.ngrok-free.app/items/score', {
        user_id: userProfile.userId,
        score_value: scoreValue,
        redemption_status: 'pending',
      });
    } catch (err) {
      console.error('Error storing score in Directus:', err);
    }
  };

  const handleClaimBonus = async () => {
    alert(`คุณได้รับโบนัสทั้งหมด ${totalBonus} Points`);
    try {
      await axios.patch('https://13f6-49-49-62-225.ngrok-free.app/items/user', {
        data: { total_bonus: totalBonus },
        filter: { line_user_id: { _eq: userProfile.userId } },
      });

      await axios.patch('https://13f6-49-49-62-225.ngrok-free.app/items/score', {
        data: { redemption_status: 'done' },
        filter: { user_id: { _eq: userProfile.userId }, redemption_status: { _eq: 'pending' } },
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
      </Card>
    </Box>
  );
};

export default App;
