
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

const proxyUrl = 'https://serverpuabas-1.onrender.com'; // Replace with actual proxy or ngrok URL

const getRandomScore = () => {
  const totalWeight = 911111010;
  const randomInt = Math.floor(Math.random() * totalWeight) + 1;

  if (randomInt <= 10) return Math.floor(Math.random() * (10000 - 5001 + 1)) + 5001;
  if (randomInt <= 1010) return Math.floor(Math.random() * (4999 - 3001 + 1)) + 3001;
  if (randomInt <= 11010) return Math.floor(Math.random() * (3000 - 1001 + 1)) + 1001;
  if (randomInt <= 111010) return Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
  if (randomInt <= 1111010) return Math.floor(Math.random() * (499 - 300 + 1)) + 300;
  if (randomInt <= 11111110) return Math.floor(Math.random() * (299 - 100 + 1)) + 100;
  if (randomInt <= 61111110) return Math.floor(Math.random() * (99 - 50 + 1)) + 50;
  if (randomInt <= 211111110) return Math.floor(Math.random() * (49 - 21 + 1)) + 21;
  return Math.floor(Math.random() * (20 - 1 + 1)) + 1;
};


const App = () => {
  const [score, setScore] = useState(null); // ประกาศตัวแปร score
  const [isAnimating, setIsAnimating] = useState(false); // ประกาศตัวแปร isAnimating
  const [totalBonus, setTotalBonus] = useState(0); // ประกาศตัวแปร totalBonus
  const [userProfile, setUserProfile] = useState(null);
  const [remainingChances, setRemainingChances] = useState(0); // ค่าเริ่มต้นคือ 0
  const [isLoading, setIsLoading] = useState(true); // ค่าเริ่มต้นขณะโหลดข้อมูล

  // ฟังก์ชันบันทึกข้อมูลผู้ใช้ใหม่
  const storeUserProfile = async (profile,userEmail) => {
    try {
      const response = await axios.post(`${proxyUrl}/items/user`, {
        line_user_id: profile.userId,
        display_name: profile.displayName,
        email: profile.email || userEmail,
        profile_picture_url: profile.pictureUrl,
        random_draws_available: 5, // ค่าเริ่มต้น
        total_bonus: 0 // ค่าเริ่มต้น
      });
      console.log('User profile stored successfully:', response.data);
    } catch (err) {
      console.error('Error storing user profile:', err);
    }
  };

  // ฟังก์ชันสุ่มคะแนน (Handle randomization)
// ฟังก์ชันสำหรับบันทึกคะแนนลงใน Data Collection "Score" และลดจำนวนสิทธิ์
const handleRandomize = async () => {
  if (!isAnimating && remainingChances > 0) {
    setIsAnimating(true);
    const randomScore = getRandomScore(); // สุ่มคะแนนจากฟังก์ชัน getRandomScore
    setScore(randomScore);

    try {
      // บันทึกคะแนนลงใน Data Collection "Score"
      await axios.post(`${proxyUrl}/items/score`, {
        line_user_id: userProfile.userId,
        score_value: randomScore,
        redemption_status: "pending", // ตั้งค่าเริ่มต้นเป็น pending
        created_at: new Date(), // วันที่ที่ทำการสุ่ม
        updated_at: new Date() // อัพเดทเวลาเมื่อทำการสุ่ม
      });

      // ลดจำนวนสิทธิ์ที่เหลืออยู่
      const updatedChances = remainingChances - 1;
      setRemainingChances(updatedChances); // อัพเดทจำนวนสิทธิ์ใน UI

      // อัพเดทจำนวนสิทธิ์ในฐานข้อมูล
      await axios.patch(`${proxyUrl}/items/user/${userProfile.userId}`, {
        random_draws_available: updatedChances, // ลดจำนวนสิทธิ์ที่เหลืออยู่
      });

    } catch (err) {
      console.error('Error updating score or chances:', err);
    } finally {
      setIsAnimating(false); // หยุดแอนิเมชันหลังจากทำการสุ่มเสร็จสิ้น
    }
  }
};


  // ฟังก์ชันเคลมโบนัส (Handle bonus claim)
  const handleClaimBonus = () => {
    setTotalBonus(0); // รีเซ็ต totalBonus หลังจากเคลมแล้ว
    alert(`คุณเคลมคะแนนโบนัสทั้งหมด ${totalBonus} Points`);
  };

  // ฟังก์ชันเพิ่มสิทธิ์ในการสุ่ม (Handle add chances)
  const handleAddChances = () => {
    setRemainingChances(remainingChances + 1); // เพิ่มสิทธิ์ในการสุ่ม
  };

  
// ฟังก์ชันดึงข้อมูลสิทธิ์ในการสุ่มจาก Random Draws Available
const fetchRemainingDraws = async (lineUserId) => {
  try {
    const response = await axios.post(`${proxyUrl}/items/user/?filter[line_user_id][_eq]=${lineUserId}`);
    console.log('Line User ID:', lineUserId);
    console.log('จำนวนสิทธิ์ :', response.data);

    if (response.data) {
      // ใช้ Random Draws Available แทน Draw Status
      setRemainingChances(response.data.random_draws_available || 99); // ดึง Random Draws Available
      setTotalBonus(response.data.total_bonus || 11); // ดึงคะแนนสะสมทั้งหมด
    } else {
      console.error('No data found for user');
    }
  } catch (err) {
    console.error('Error fetching draw status:', err);
  }
};


const checkUserExists = async (lineUserId) => {
  try {
    const response = await axios.post(`${proxyUrl}/items/user?filter[line_user_id][_eq]=${lineUserId}`);
    // ตรวจสอบว่า response.data มีค่าหรือไม่และเป็นผู้ใช้ที่ตรงกัน
    if (response.data.data && response.data.data.length > 0) {
      console.log('User exists:', response.data.data);
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error('Error checking user existence:', err);
    return false;
  }
};

  const fetchUserProfile = async () => {
    try {
      const profile = await liff.getProfile();
      const idToken = liff.getDecodedIDToken();
      setUserProfile(profile);
  
      // พิมพ์ข้อมูลที่ดึงได้เพื่อตรวจสอบ
      console.log('User Profile:', profile);
      console.log('ID Token:', idToken);
  
      // ดึง email จาก idToken
      const userEmail = idToken.email;
      console.log('User Email:', userEmail);
  
      // เช็คว่ามีผู้ใช้ในระบบหรือไม่
      const userExists = await checkUserExists(profile.userId);
      if (!userExists) {
        console.log('User does not exist, creating new user');
        await storeUserProfile(profile,userEmail); // บันทึกผู้ใช้ใหม่เฉพาะเมื่อไม่พบผู้ใช้เดิม
      }
  
  
      // หลังจากนั้นดึงข้อมูลสิทธิ์ในการสุ่มจาก Random Draws Available
      await fetchRemainingDraws(profile.userId);
      console.log('หลังจากนั้นดึงข้อมูลสิทธิ์ในการสุ่มจาก Random Draws Available');
      
      // อัปเดตสถานะ isLoading หลังจากดึงข้อมูลเสร็จสิ้น
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // ตั้ง isLoading เป็น false ในกรณีที่เกิดข้อผิดพลาด
      setIsLoading(false);
    }
  };
  
  
  

  // ฟังก์ชัน LIFF initialization
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: '2006313023-25YJYLoe', withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          await fetchUserProfile(); // ดึงข้อมูลผู้ใช้หลังจาก LIFF init
        }
      } catch (err) {
        console.error('LIFF Initialization failed', err);
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